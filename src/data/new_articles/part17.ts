import rawPart17 from "./raw/tibbiy-maqolalar-17.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart17 = parseMarkdownArticles(rawPart17, 161);
