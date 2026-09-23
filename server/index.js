import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";

try {
    process.loadEnvFile();
} catch (error) {
    if (error.code !== "ENOENT") throw error;
}

const port = Number(process.env.PORT || 3000);
const projectUrl = process.env.SUPABASE_URL;
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const releaseVersion = process.env.GAME_RELEASE_VERSION || "1.0";
const allowedOrigins = new Set(
    (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

if (!projectUrl || !publicKey) {
    throw new Error("Configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY) in the server environment.");
}

const authClient = createClient(projectUrl, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});
const adminClient = serviceRoleKey ? createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
}) : null;

function sendJson(response, status, body, corsOrigin) {
    const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Vary": "Origin"
    };
    if (corsOrigin) {
        headers["Access-Control-Allow-Origin"] = corsOrigin;
        headers["Access-Control-Allow-Methods"] = "GET, PATCH, POST, OPTIONS";
        headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    }
    response.writeHead(status, headers);
    response.end(JSON.stringify(body));
}

async function readJson(request) {
    let body = "";
    for await (const chunk of request) {
        body += chunk.toString("utf8");
        if (body.length > 4096) throw Object.assign(new Error("Request too large"), { status: 413 });
    }
    if (!body) return {};
    try {
        return JSON.parse(body);
    } catch {
        throw Object.assign(new Error("Invalid JSON"), { status: 400 });
    }
}

function createUserClient(token) {
    return createClient(projectUrl, publicKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
}

async function authenticate(request) {
    const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return { error: "Authentication required", status: 401 };
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return { error: "Invalid session", status: 401 };
    return { user, client: createUserClient(token) };
}

export async function handler(request, response) {
    const origin = request.headers.origin;
    const forwardedHost = request.headers["x-forwarded-host"] || request.headers.host;
    const forwardedProto = request.headers["x-forwarded-proto"]?.split(",")[0] || "https";
    const isSameOrigin = origin && forwardedHost && origin === `${forwardedProto}://${forwardedHost}`;
    if (origin && !allowedOrigins.has(origin) && !isSameOrigin) {
        sendJson(response, 403, { error: "Origin not allowed" });
        return;
    }

    if (request.method === "OPTIONS") {
        response.writeHead(204, {
            "Vary": "Origin",
            ...(origin ? {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, PATCH, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
                "Access-Control-Max-Age": "600"
            } : {})
        });
        response.end();
        return;
    }

    const requestUrl = new URL(request.url || "/", "http://localhost");
    const path = requestUrl.pathname;
    if (request.method === "GET" && path === "/api/health") {
        sendJson(response, 200, { status: "ok" }, origin);
        return;
    }

    try {
        if (path === "/api/profile" && request.method === "GET") {
            const auth = await authenticate(request);
            if (auth.error) return sendJson(response, auth.status, { error: auth.error }, origin);
            return sendJson(response, 200, {
                id: auth.user.id,
                email: auth.user.email,
                full_name: auth.user.user_metadata?.full_name || "Usuário"
            }, origin);
        }

        if (path === "/api/payments" && ["GET", "POST"].includes(request.method)) {
            const auth = await authenticate(request);
            if (auth.error) return sendJson(response, auth.status, { error: auth.error }, origin);

            if (request.method === "GET") {
                const { data: payments, error } = await auth.client
                    .from("simulated_payments")
                    .select("id, edition, amount_brl, status, created_at")
                    .order("created_at", { ascending: false });
                if (error) return sendJson(response, 503, { error: "Unable to load orders" }, origin);
                const ids = payments.map((payment) => payment.id);
                let downloads = [];
                if (ids.length) {
                    const result = await auth.client
                        .from("game_downloads")
                        .select("payment_id, release_version, requested_at")
                        .in("payment_id", ids)
                        .order("requested_at", { ascending: false });
                    if (result.error) return sendJson(response, 503, { error: "Unable to load download history" }, origin);
                    downloads = result.data;
                }
                return sendJson(response, 200, { payments, downloads }, origin);
            }

            const payload = await readJson(request);
            if (!["standard", "plus"].includes(payload.edition)) {
                return sendJson(response, 400, { error: "Invalid edition" }, origin);
            }
            const { data, error } = await auth.client
                .from("simulated_payments")
                .insert({ edition: payload.edition })
                .select("id, edition, amount_brl, status, created_at")
                .single();
            if (error) return sendJson(response, 503, { error: "Unable to create order" }, origin);
            return sendJson(response, 201, data, origin);
        }

        if (path === "/api/downloads" && request.method === "POST") {
            const auth = await authenticate(request);
            if (auth.error) return sendJson(response, auth.status, { error: auth.error }, origin);
            const payload = await readJson(request);
            if (typeof payload.payment_id !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.payment_id)) {
                return sendJson(response, 400, { error: "Invalid order" }, origin);
            }
            const { data, error } = await auth.client
                .from("game_downloads")
                .insert({ payment_id: payload.payment_id, release_version: releaseVersion })
                .select("payment_id, release_version, requested_at")
                .single();
            if (error) return sendJson(response, 403, { error: "Download is not available for this order" }, origin);
            return sendJson(response, 201, data, origin);
        }

        if (path === "/api/account/delete" && request.method === "POST") {
            const auth = await authenticate(request);
            if (auth.error) return sendJson(response, auth.status, { error: auth.error }, origin);
            if (!adminClient) {
                return sendJson(response, 503, { error: "Account deletion is not configured on the server" }, origin);
            }
            const { error } = await adminClient.auth.admin.deleteUser(auth.user.id);
            if (error) {
                console.error("Account deletion failed", error);
                return sendJson(response, 500, { error: "Unable to delete account" }, origin);
            }
            return sendJson(response, 200, { deleted: true }, origin);
        }

        sendJson(response, 404, { error: "Not found" }, origin);
    } catch (error) {
        const status = Number.isInteger(error.status) ? error.status : 500;
        if (status === 500) console.error("API request failed", error);
        sendJson(response, status, { error: status === 500 ? "Request failed" : error.message }, origin);
    }
}

if (!process.env.VERCEL) {
    createServer(handler).listen(port, "0.0.0.0", () => {
        console.log(`Yokai Tales API listening on port ${port}`);
    });
}
