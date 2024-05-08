/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * File name:coterie_UE_itemReceiptMaster.js
 * Script: Coterie | UE Item Receipt Master
 * Author           Date       Version               Remarks
 * mikewilliams   09.26.2023   1.00            Initial Creation of the script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses .
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin --------------------------- */
  /**
   *
   * @param {object} scriptContext
   */
  const beforeLoad = (scriptContext) => {
    const loggerTitle = 'Before Load';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ---------------------------- Before Load - End ---------------------------- */
  //
  /* --------------------------- Before Submit - Begin --------------------------- */
  /**
   *
   * @param {object} scriptContext
   */
  const beforeSubmit = (scriptContext) => {
    const loggerTitle = 'Before Submit';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    try {
      const itemReceiptRecord = scriptContext.newRecord;

      const orderType = itemReceiptRecord.getValue({ fieldId: 'ordertype' });

      if (orderType === 'PurchOrd') {
        const createdFrom = itemReceiptRecord.getValue({
          fieldId: 'createdfrom',
        });

        const purchaseOrderLookupFields = search.lookupFields({
          type: 'purchaseorder',
          id: String(createdFrom),
          columns: [
            'custbody7',
            'custbody_coterie_total_po_weight',
            'custbody_coterie_remain_load_ship_cost',
          ],
        });

        // Reterieve PO Fields
        const totalPOWeight =
          purchaseOrderLookupFields.custbody_coterie_total_po_weight;
        const expectedLoadShippingCost = purchaseOrderLookupFields.custbody7;
        let remainingLoadShipCost =
          purchaseOrderLookupFields.custbody_coterie_remain_load_ship_cost;
        if (!remainingLoadShipCost) {
          remainingLoadShipCost = 0;
        }

        const itemRecieptLineItemCount = itemReceiptRecord.getLineCount({
          sublistId: 'item',
        });

        let totalLineLevelWeight = 0;

        for (let index = 0; index < itemRecieptLineItemCount; index++) {
          // Reterieve Item ID
          const itemId = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: index,
          });
          //
          // Reterive Item Type
          const itemType = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemtype',
            line: index,
          });
          //

          // Retrieve Quantity
          const quantity = itemReceiptRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: index,
          });

          log.debug(loggerTitle, { itemId, itemType, quantity });

          // Retrieve Item Weight
          let itemLookUpFields;
          if (itemType === 'InvtPart') {
            itemLookUpFields = search.lookupFields({
              type: search.Type.INVENTORY_ITEM,
              id: itemId,
              columns: ['weight'],
            });
          }
          log.debug(
            loggerTitle + ' Search Item Look Up Fields ',
            itemLookUpFields
          );

          if (itemLookUpFields && itemLookUpFields.weight) {
            const lineItemWeight =
              Math.ceil(itemLookUpFields.weight) * quantity;
            itemReceiptRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_cot_total_line_weight_ir',
              line: index,
              value: lineItemWeight,
            });
            totalLineLevelWeight += lineItemWeight;
          }
          //
        }

        // Set the Header Line Total Weight
        log.debug(loggerTitle, 'Header Total Weight ' + totalLineLevelWeight);
        itemReceiptRecord.setValue({
          fieldId: 'custbody_cot_total_weight_ir',
          value: totalLineLevelWeight,
        });
        //

        itemReceiptRecord.setValue({
          fieldId: 'landedcostmethod',
          value: 'WEIGHT',
        });

        // Calculate landed Cost
        if (totalLineLevelWeight === totalPOWeight) {
          itemReceiptRecord.setValue({
            fieldId: 'landedcostamount3',
            value: expectedLoadShippingCost,
          });
          remainingLoadShipCost = 0;
          record.submitFields({
            type: 'purchaseorder',
            id: createdFrom,
            values: {
              custbody_coterie_remain_load_ship_cost: remainingLoadShipCost,
            },
          });
        } else if (totalLineLevelWeight < totalPOWeight) {
          //
          log.debug(loggerTitle + ' Else Block', {
            totalLineLevelWeight,
            totalPOWeight,
          });

          const percentage = Math.round(
            (totalLineLevelWeight / totalPOWeight) * 100
          );
          log.debug(loggerTitle, { percentage });

          const landedCostIR = Math.round(
            (percentage / 100) * expectedLoadShippingCost
          );
          log.debug(loggerTitle, { landedCostIR });

          itemReceiptRecord.setValue({
            fieldId: 'landedcostamount3',
            value: landedCostIR,
          });

          remainingLoadShipCost -= landedCostIR;
          log.debug(loggerTitle, {
            remainingLoadShipCost,
          });

          record.submitFields({
            type: 'purchaseorder',
            id: createdFrom,
            values: {
              custbody_coterie_remain_load_ship_cost: Math.abs(
                remainingLoadShipCost
              ),
            },
          });
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ---------------------------- Before Submit - End ---------------------------- */
  //
  /* --------------------------- After Submit - Begin --------------------------- */
  /**
   *
   * @param {object} scriptContext
   */
  const afterSubmit = (scriptContext) => {
    const loggerTitle = 'After Submit';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ---------------------------- After Submit - End ---------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
