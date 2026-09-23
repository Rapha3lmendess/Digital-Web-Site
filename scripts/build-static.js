import { cp, mkdir } from "node:fs/promises";

const directories = ["css", "imagens", "js", "paginas"];

await mkdir("dist", { recursive: true });
await cp("index.html", "dist/index.html");
for (const directory of directories) {
    await cp(directory, `dist/${directory}`, { recursive: true, force: true });
}
