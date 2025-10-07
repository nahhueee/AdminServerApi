export class Actualizacion {
    id?:number;
    idApp?:number;
    resumen?:string;
    mejoras?:string;
    correcciones?:string;
    version?:string;
    link?:string;
    front?:boolean;
    fecha?:Date;
    estado?:string;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.idApp = data.idApp;
          this.resumen = data.resumen;
          this.mejoras = data.mejoras;
          this.correcciones = data.correcciones;
          this.version = data.version;
          this.link = data.link;
          this.front = data.front;
          this.fecha = data.fecha;
          this.estado = data.estado;
        }
    }
}