import rawPart16 from "./raw/tibbiy-maqolalar-16.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart16 = parseMarkdownArticles(rawPart16, 151);
