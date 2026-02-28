import rawPart20 from "./raw/tibbiy-maqolalar-20.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart20 = parseMarkdownArticles(rawPart20, 191);
