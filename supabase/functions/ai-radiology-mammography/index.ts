import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRadiologySubmodule } from "../_shared/radiology-handler.ts";
serve((req) => handleRadiologySubmodule(req, "mammography", "ai-radiology-mammography"));
