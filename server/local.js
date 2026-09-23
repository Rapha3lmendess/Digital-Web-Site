import { createServer } from "node:http";
import { handler } from "./index.js";

const port = Number(process.env.PORT || 3000);
createServer(handler).listen(port, "0.0.0.0", () => {
    console.log(`Yokai Tales API listening on port ${port}`);
});
