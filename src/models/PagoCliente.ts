export class PagoCliente{
    id?:number;
    idCliente?:number;
    monto?:number;
    fecha?:Date;
    obs?:string;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.idCliente = data.idCliente;
          this.monto = data.monto;
          this.fecha = data.fecha;
          this.obs = data.obs;
        }
    }
}