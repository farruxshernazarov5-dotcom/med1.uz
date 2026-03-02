import rawPart25 from "./raw/tibbiy-maqolalar-25.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart25 = parseMarkdownArticles(rawPart25, 241);
