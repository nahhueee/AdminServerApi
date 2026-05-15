export class App {
    id?:number;
    portada?:string;
    nombre?:string;
    version?:string;
    versionBackend?:string;
    versionFrontend?:string;
    clientes?:number;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.portada = data.portada;
          this.nombre = data.nombre;
          this.version = data.version;
          this.versionBackend = data.versionBackend;
          this.versionFrontend = data.versionFrontend;
          this.clientes = data.clientes;
        }
    }
}