/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(["N/record", "N/format"], function (record, format) {
  const exports = {};

  /* ------------------------ Before Submit Begin ------------------------ */
  function beforeSubmit(scriptContext) {
    var rec = scriptContext.newRecord;

    var updateWOFlag = false;

    var dueDate = rec.getValue({
      fieldId: "duedate",
    });

    if (dueDate) {
      dueDate = format.format({
        type: format.Type.DATE,
        value: dueDate,
      });
    }

    var poLineItemCount = rec.getLineCount({
      sublistId: "item",
    });

    for (var i = 0; i < poLineItemCount; i++) {
      /* ----------------------- Description Populated Begin ---------------------- */
      // Customer/Sales Order ID
      var customerOrderId = rec.getSublistValue({
        sublistId: "item",
        fieldId: "custcol_dm_related_custorder",
        line: i,
      });
      /* ------------------- Customer/Sales Order Begin ------------------- */
      if (customerOrderId) {
        //Load Record
        var cRec = record.load({
          type: record.Type.SALES_ORDER,
          id: Number(customerOrderId),
        });
        var cuWoId;
        /* ------------------- Record Read/Write Operations Begin ------------------- */
        var cuLineItemCount = cRec.getLineCount({
          sublistId: "item",
        });

        for (var j = 0; j < cuLineItemCount; j++) {
          //Check Values Before Setting Them
          var cuPoNumber = cRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_dm_po_number",
            line: j,
          });
          var cuDueDate = cRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_dm_rec_by_date",
            line: j,
          });
          if (!cuPoNumber) {
            cRec.setSublistValue({
              sublistId: "item",
              fieldId: "custcol_dm_po_number",
              line: j,
              value: rec.id,
            });
          }

          if (dueDate && !cuDueDate) {
            cRec.setSublistValue({
              sublistId: "item",
              fieldId: "custcol_dm_rec_by_date",
              line: j,
              value: dueDate,
            });
          }
          cuWoId = cRec.getSublistValue({
            sublistId: "item",
            fieldId: "woid",
            line: j,
          });
          if (cuWoId) {
            cuWoId = Number(cuWoId);
            record.submitFields({
              type: record.Type.WORK_ORDER,
              id: cuWoId,
              values: {
                custbody_dm_po_num_mo: rec.id,
                custbody_dm_rec_by_date_mo: dueDate,
              },
            });
            if (updateWOFlag === false) {
              updateWOFlag = true;
              rec.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_dm_related_millorder",
                value: cuWoId,
                line: i,
              });
            }
          }
        }

        /* ------------------- Record Read/Write Operations End ------------------- */
        //Save Record
        cRec.save();
      }
      /* ------------------- Customer/Sales Order End ------------------- */
    }
  }
  /* ------------------------ Before Submit End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
