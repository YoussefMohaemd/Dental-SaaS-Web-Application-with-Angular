import { Injectable } from "@angular/core";
import { SubOrder } from "@core/interfaces";

@Injectable({ providedIn: "root" })
export class SubOrderAdapter {
  SubOrderAdapter(response: SubOrder[]): SubOrder[] {
    return response.map((item) => ({ ...item, teeth: [...item.teeth] }));
  }
}
