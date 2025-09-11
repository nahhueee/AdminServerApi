export class App {
    id?:number;
    portada?:string;
    nombre?:string;
    version?:string;
    link?:string;
    info?:string;
    estado?:string
    clientes?:number;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.portada = data.portada;
          this.nombre = data.nombre;
          this.version = data.version;
          this.link = data.link;
          this.info = data.info;
          this.estado = data.estado;
          this.clientes = data.clientes;
        }
    }
}