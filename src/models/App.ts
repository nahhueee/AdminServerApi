export class App {
    id?:number;
    portada?:string;
    nombre?:string;
    version?:string;
    clientes?:number;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.portada = data.portada;
          this.nombre = data.nombre;
          this.version = data.version;
          this.clientes = data.clientes;
        }
    }
}