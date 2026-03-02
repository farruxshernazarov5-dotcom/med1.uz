import rawPart23 from "./raw/tibbiy-maqolalar-23.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart23 = parseMarkdownArticles(rawPart23, 221);
