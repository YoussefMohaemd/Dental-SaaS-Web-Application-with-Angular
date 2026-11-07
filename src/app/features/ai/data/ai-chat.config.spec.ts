import { lucideSvg } from "@shared/icons/lucide-icons";
import { AI_QUICK_ACTIONS } from "./ai-chat.config";

describe("AI_QUICK_ACTIONS", () => {
  it("uses supported icons for all quick actions", () => {
    for (const action of AI_QUICK_ACTIONS) {
      expect(lucideSvg(action.icon, 14)).withContext(action.id).not.toBe("");
    }
  });
});
