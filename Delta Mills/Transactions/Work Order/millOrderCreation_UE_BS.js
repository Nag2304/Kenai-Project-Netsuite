/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/record", "N/log", "N/format"], function (record, log, format) {
  const exports = {};
  /* ---------------------------- Before Submit Begin --------------------------- */
  function beforeSubmit(context) {
    try {
      var millOrderRecord = context.newRecord;

      var invtPartFlag = "N";
      /* ---------------------------- Body Fields Begin --------------------------- */
      // Retrive Order Status
      var orderStatus = millOrderRecord.getValue({ fieldId: "orderstatus" });

      //Retrive Scheduled Week Of Production
      var scheduleWeekOfProduction = millOrderRecord.getValue({
        fieldId: "custbody_dm_sched_wo_production",
      });
      if (scheduleWeekOfProduction) {
        scheduleWeekOfProduction = format.parse({
          value: scheduleWeekOfProduction,
          type: format.Type.DATE,
        });
      }
      

      const millOrderStatus = millOrderRecord.getValue({fieldId:'custbody_dm_mill_order_status_mo'});
      
      if(millOrderStatus == "9"){
              const today = new Date();
const date = today.getMonth()+1 + '/' + today.getDate() + '/' + today.getFullYear();
      millOrderRecord.setValue({fieldId:'custbody_dm_prod_start_date',value:today});
      }

      //Retrive Mill Order #
      var millOrderNumber = millOrderRecord.getValue({ fieldId: "tranid" });

      /* ----------------------------- Body Fields End ---------------------------- */
      //
      /* ---------------------------- Line Fields Begin --------------------------- */
      var lineItemCount = millOrderRecord.getLineCount({ sublistId: "item" });
      for (var i = 0; i < lineItemCount; i++) {
        //Item Type
        var itemType = millOrderRecord.getSublistValue({
          sublistId: "item",
          fieldId: "itemtype",
          line: i,
        });
        if (itemType === "InvtPart") {
          invtPartFlag = "Y";
          // Component Item
          var componentItem = millOrderRecord.getSublistValue({
            sublistId: "item",
            fieldId: "item_display",
            line: i,
          });
          // Quantity
          var quantity = millOrderRecord.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });
          // Quantity Back Ordered
          var backOrderQty = millOrderRecord.getSublistValue({
            sublistId: "item",
            fieldId: "quantitybackordered",
            line: i,
          });
          // Quantity Available
          var quantityAvailable = millOrderRecord.getSublistValue({
            sublistId: "item",
            fieldId: "quantityavailable",
            line: i,
          });
          // Quantity On Hand
          var quantityAllocated = millOrderRecord.getSublistValue({
            sublistId: "item",
            fieldId: "quantityonhand",
            line: i,
          });
          // Quantity Remaining On
          var quantityRemainingOn = quantityAllocated - quantityAvailable;
          // Quantity Remaining
          var quantityRemaining = backOrderQty - quantityAllocated;
        }
      }
      /* ----------------------------- Line Fields End ---------------------------- */
      //
      if (invtPartFlag === "Y") {
        /* -------------------------- Create Custom Record -  Begin -------------------------- */
        var customRec = record.create({
          type: "customrecord_millpodetails",
          isDynamic: true,
        });
        /* ---------------------------- Set Values Begin ---------------------------- */
        customRec.setValue({
          fieldId: "custrecord_mo_millordernumber",
          value: millOrderNumber,
        });
        customRec.setValue({
          fieldId: "custrecord_mo_componentitemnumber",
          value: componentItem,
        });
        customRec.setValue({
          fieldId: "custrecord_mo_scheduledwkprod",
          value: scheduleWeekOfProduction,
        });
        customRec.setValue({
          fieldId: "custrecord_mo_millorderqty",
          value: quantity,
        });
        /* ---------------------------- Caculations Begin --------------------------- */
        if (
          backOrderQty <= 0 ||
          backOrderQty === null ||
          backOrderQty === undefined
        ) {
          backOrderQty = 0;
        }
        customRec.setValue({
          fieldId: "custrecord_mo_backorderqty",
          value: backOrderQty,
        });
        if (
          quantityAvailable <= 0 ||
          quantityAvailable === null ||
          quantityAvailable === undefined
        ) {
          quantityAvailable = 0;
        }
        customRec.setValue({
          fieldId: "custrecord_mo_availableon",
          value: quantityAvailable,
        });
        if (
          quantityAllocated <= 0 ||
          quantityAllocated === null ||
          quantityAllocated === undefined
        ) {
          quantityAllocated = 0;
        }
        customRec.setValue({
          fieldId: "custrecord_mo_allocatedon",
          value: quantityAllocated,
        });
        if (
          quantityRemainingOn <= 0 ||
          quantityRemainingOn === null ||
          quantityRemainingOn === undefined
        ) {
          quantityRemainingOn = 0;
        }
        customRec.setValue({
          fieldId: "custrecord_mo_remainingon",
          value: quantityRemainingOn,
        });
        if (
          quantityRemaining <= 0 ||
          quantityRemaining === undefined ||
          quantityRemaining === null
        ) {
          quantityRemaining = 0;
        }
        customRec.setValue({
          fieldId: "custrecord_mo_remaining",
          value: quantityRemaining,
        });
        /* ---------------------------- Caculations End --------------------------- */
        //
        /* ---------------------------- Set Values End ---------------------------- */
        //
        customRec.save();
        /* -------------------------- Create Custom Record -  End-------------------------- */
      }
    } catch (err) {
      log.debug({ title: "Script Error Occured", details: err });
    }
  }
  /* ---------------------------- Before Submit End--------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
