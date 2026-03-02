import rawPart26 from "./raw/tibbiy-maqolalar-26.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart26 = parseMarkdownArticles(rawPart26, 251);
