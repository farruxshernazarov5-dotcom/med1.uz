import rawPart19 from "./raw/tibbiy-maqolalar-19.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart19 = parseMarkdownArticles(rawPart19, 181);
