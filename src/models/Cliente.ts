import { App } from "./App";

export class Cliente {
    id?:number;
    nombre?:string;
    DNI?:string;
    email?:string;
    descripcion?:string;
    fechaAlta?:Date;
    apps:App[] = [];

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.nombre = data.nombre;
          this.DNI = data.DNI;
          this.email = data.email;
          this.descripcion = data.descripcion;
          this.fechaAlta = data.fechaAlta;
          this.apps = data.apps;
        }
    }
}