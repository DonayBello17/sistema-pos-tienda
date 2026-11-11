const crypto = require('crypto');

/**
 * Servicio de Interoperabilidad Tributaria y Facturación Electrónica DIAN Colombia (UBL 2.1)
 */
class DianService {
  /**
   * Parámetros emisores fiscales por defecto para la tienda
   */
  static NIT_EMISOR = '900987654-3';
  static CLAVE_TECNICA = 'fc8eac422eba16e122d5aa92a14d204c212f3403';
  static TIPO_AMBIENTE = '2'; // 1=Producción, 2=Habilitación/Pruebas DIAN

  /**
   * Calcula el desglose impositivo de una lista de productos
   * @param {Array} items - [{ precio_base, tarifa_iva, cantidad }]
   * @param {number} descuentoPorcentaje - Porcentaje de descuento global (0 a 100)
   */
  static calcularImpuestos(items, descuentoPorcentaje = 0) {
    let base_19 = 0;
    let base_5 = 0;
    let base_0 = 0;
    let iva_19 = 0;
    let iva_5 = 0;

    for (const item of items) {
      const cantidad = Number(item.cantidad || 0);
      const precioBase = Number(item.precio_base || 0);
      const subtotalItem = precioBase * cantidad;
      const tarifa = String(item.tarifa_iva || '0');

      if (tarifa === '19') {
        base_19 += subtotalItem;
        iva_19 += subtotalItem * 0.19;
      } else if (tarifa === '5') {
        base_5 += subtotalItem;
        iva_5 += subtotalItem * 0.05;
      } else {
        base_0 += subtotalItem;
      }
    }

    const subtotal_base = base_19 + base_5 + base_0;
    const total_impuestos = iva_19 + iva_5;
    const bruto = subtotal_base + total_impuestos;
    
    const pctDesc = Math.max(0, Math.min(100, Number(descuentoPorcentaje) || 0));
    const descuento = bruto * (pctDesc / 100);
    const total_pagar = Math.max(0, bruto - descuento);

    return {
      subtotal_base: Number(subtotal_base.toFixed(2)),
      base_19: Number(base_19.toFixed(2)),
      base_5: Number(base_5.toFixed(2)),
      base_0: Number(base_0.toFixed(2)),
      iva_19: Number(iva_19.toFixed(2)),
      iva_5: Number(iva_5.toFixed(2)),
      total_impuestos: Number(total_impuestos.toFixed(2)),
      descuento: Number(descuento.toFixed(2)),
      total_pagar: Number(total_pagar.toFixed(2))
    };
  }

  /**
   * Genera el CUFE (Código Único de Facturación Electrónica) según Anexo Técnico DIAN UBL 2.1
   * Cadena de hashing SHA-384:
   * NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + CodImp2 + ValImp2 + CodImp3 + ValImp3 + ValTot + NitEmisor + DocAdq + ClaveTecnica + TipoAmbiente
   */
  static generarCUFE({
    numeroFactura,
    fecha,
    hora,
    subtotalBase,
    iva19,
    iva5,
    totalPagar,
    nitEmisor = DianService.NIT_EMISOR,
    docAdquiriente,
    claveTecnica = DianService.CLAVE_TECNICA,
    tipoAmbiente = DianService.TIPO_AMBIENTE
  }) {
    const valFacStr = Number(subtotalBase).toFixed(2);
    const iva19Str = Number(iva19).toFixed(2);
    const iva5Str = Number(iva5).toFixed(2);
    const iva0Str = '0.00';
    const valTotStr = Number(totalPagar).toFixed(2);

    // Cadena técnica normalizada
    const cadenaCUFE = `${numeroFactura}${fecha}${hora}${valFacStr}01${iva19Str}01${iva5Str}01${iva0Str}${valTotStr}${nitEmisor}${docAdquiriente}${claveTecnica}${tipoAmbiente}`;

    // Hash criptográfico SHA-384
    const cufe = crypto.createHash('sha384').update(cadenaCUFE, 'utf8').digest('hex');
    return { cufe, cadenaOrigen: cadenaCUFE };
  }

  /**
   * Construye el payload estandarizado para el código QR de validación fiscal DIAN
   */
  static generarQRPayload({
    numeroFactura,
    fecha,
    nitEmisor = DianService.NIT_EMISOR,
    docAdquiriente,
    subtotalBase,
    ivaTotal,
    totalPagar,
    cufe
  }) {
    const params = new URLSearchParams({
      NumFac: numeroFactura,
      FecFac: fecha,
      NitFac: nitEmisor,
      DocAdq: docAdquiriente,
      ValFac: Number(subtotalBase).toFixed(2),
      ValIva: Number(ivaTotal).toFixed(2),
      ValOtro: '0.00',
      ValTolFac: Number(totalPagar).toFixed(2),
      CUFE: cufe,
      QRCode: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`
    });

    return params.toString();
  }

  /**
   * Genera el siguiente identificador consecutivo de factura electrónica
   */
  static async obtenerSiguienteConsecutivo(conn) {
    const [[ultimo]] = await conn.query(
      `SELECT numero_factura FROM ventas_facturas ORDER BY id_venta DESC LIMIT 1`
    );

    let siguienteNumero = 1;
    if (ultimo && ultimo.numero_factura) {
      const match = ultimo.numero_factura.match(/\d+$/);
      if (match) {
        siguienteNumero = parseInt(match[0], 10) + 1;
      }
    }

    return `FAC-${String(siguienteNumero).padStart(8, '0')}`;
  }
}

module.exports = DianService;
