/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/**
 * File name: asbs_SS_generateWorkOrderComponentUpdater.js
 * Script: ASBS | SS WO Component Updater
 * Author           Date       Version               Remarks
 * nagendrababu  07.08.2025      1.00      Initial creation of the script
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
  const UOM_MAP = {
    Ft: 13,
    SQ: 15,
    SQFT: 14,
    Ea: 1,
    Each: 1,
    'Case3/6': 5,
    'Case2/6': 4,
    Case6: 3,
    Case8: 6,
    Case: 2,
    '30ct Floorsand': 10,
    'Case12/4': 7,
    '48ct Dumpbin': 8,
    '72ct Dumpbin': 9,
    LB: 11,
    CWT: 16,
    KG: 12,
  };

  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------Execute - Begin --------------------------- */
  /**
   * Entry point
   * @param {Object} context
   */
  const execute = (context) => {
    const loggerTitle = 'Execute';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    try {
      log.debug(loggerTitle, context);
      //
      const detailRecords = getUnprocessedDetails();
      detailRecords.forEach(processDetailRecord);
      //
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    return true;
  };
  /* ----------------------------Execute - End ---------------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /**
   * Retrieves all work order detail records
   * @returns {Array} Array of result objects
   */
  const getUnprocessedDetails = () => {
    const loggerTitle = 'Get Un Processed Details';
    const results = [];
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    try {
      const detailSearch = search.create({
        type: 'customrecord_as_workorder_details',
        filters: [['custrecord_as_so_workorder', 'isempty', '']],
        columns: [
          'custrecord_sc_job_number',
          'custrecord_as_item',
          'custrecord_as_qty',
          'custrecord_as_item_class',
          'custrecord_as_sub_assy',
          'custrecord_as_sub_assy_uom',
          'custrecord_as_component',
          'custrecord_as_comp_qty',
          'custrecord_as_comp_uom',
          'custrecord_as_comp_desc',
          'custrecord_as_so_workorder',
          'custrecord_as_sub_workorder',
        ],
      });

      detailSearch.run().each((result) => {
        results.push(result);
        return true;
      });

      log.debug(loggerTitle, results);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    return results;
  };
  //

  /**
   * Processes a single work order detail record
   * @param {Object} result - The search result row
   */
  const processDetailRecord = (result) => {
    const loggerTitle = 'Process Detail Record';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    try {
      const jobNumber = result.getValue('custrecord_sc_job_number');
      const itemClass = result.getValue('custrecord_as_item_class');
      const woItem = result.getValue('custrecord_as_item');
      const woQty = parseFloat(result.getValue('custrecord_as_qty')) || 1;
      const isSubAssembly = result.getValue('custrecord_as_sub_assy') === 'T';
      //const woUom = result.getValue('custrecord_as_sub_assy_uom');

      const componentItem = result.getValue('custrecord_as_component');
      const componentQty =
        parseFloat(result.getValue('custrecord_as_comp_qty')) || 1;
      const componentUom = result.getValue('custrecord_as_comp_uom');
      const componentDesc = result.getValue('custrecord_as_comp_desc');

      const recordId = result.id;

      log.debug(loggerTitle, {
        jobNumber,
        itemClass,
        woItem,
        componentItem,
        componentQty,
        componentUom,
        componentDesc,
        isSubAssembly,
      });

      const soId = findSalesOrder(jobNumber);
      if (!soId) {
        log.error(loggerTitle, `No Sales Order found for Job #: ${jobNumber}`);
        return;
      }

      const wo = isSubAssembly
        ? findChildWorkOrder(soId, itemClass, woItem)
        : findTopLevelWorkOrder(soId, itemClass, woItem);

      if (!wo) return;
      log.debug(loggerTitle, `Work Order: ${wo}`);

      if (isSubAssembly) {
        // Sub-Assembly -> Add new component line
        const updatedId = addComponentToWorkOrder(
          wo.id,
          componentItem,
          componentQty,
          componentUom,
          componentDesc
        );
        log.debug(loggerTitle, `Updated Subassembly ID: ${updatedId}`);
        if (updatedId) updateCustomRecord(recordId, wo.tranid);
      } else {
        // Top-Level -> Update existing line quantity
        const updatedId = updateWOItemQty(wo.id, woItem, woQty); // woQty comes from custrecord_as_qty
        log.debug(loggerTitle, `Updated Top-Level WO ID: ${updatedId}`);
        if (updatedId) updateCustomRecord(recordId, wo.tranid);
      }
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
  };
  //
  /**
   * Finds Sales Order internal ID using Job # (tranid)
   * @param {string} jobNumber
   * @returns {string|null} Sales Order internal ID
   */
  const findSalesOrder = (jobNumber) => {
    const loggerTitle = 'Find Sales Order Id';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    let results;
    try {
      const soSearch = search.create({
        type: 'salesorder',
        filters: [['tranid', 'is', jobNumber]],
        columns: ['internalid'],
      });
      results = soSearch.run().getRange({ start: 0, end: 1 });
      log.debug(loggerTitle, results);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    return results && results.length ? results[0].getValue('internalid') : null;
  };
  /**
   *
   * @param {Number} soId
   * @param {Number} itemClass
   * @param {Number} woItem
   * @returns {Object}
   */
  const findTopLevelWorkOrder = (soId, itemClass, woItem) => {
    const loggerTitle = 'Find Top Level Work Order';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    let result;
    try {
      log.debug(loggerTitle, { soId, itemClass, woItem });

      if (!soId || !itemClass || !woItem) {
        log.error(
          loggerTitle,
          'Missing one of the required parameters: soId, itemClass, or woItem'
        );
        return null;
      }

      const woSearch = search.create({
        type: 'workorder',
        filters: [
          ['createdfrom.internalidnumber', 'equalto', soId],
          'AND',
          ['class', 'anyof', itemClass],
          'AND',
          ['item.internalidnumber', 'equalto', woItem],
        ],
        columns: ['internalid', 'tranid'],
      });
      result = woSearch.run().getRange({ start: 0, end: 1 });
      log.debug(loggerTitle, result);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    return result && result.length
      ? {
          id: result[0].getValue('internalid'),
          tranid: result[0].getValue('tranid'),
        }
      : null;
  };

  /**
   *
   * @param {Number} soId
   * @param {Number} itemClass
   * @param {Number} woItem
   * @returns {Object}
   */
  const findChildWorkOrder = (soId, itemClass, woItem) => {
    const loggerTitle = 'Find Child Work Order';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    let result;
    try {
      log.debug(loggerTitle, { soId, itemClass, woItem });

      if (!soId || !itemClass || !woItem) {
        log.error(
          loggerTitle,
          'Missing one of the required parameters: soId, itemClass, or woItem'
        );
        return null;
      }

      const woSearch = search.create({
        type: 'workorder',
        filters: [
          ['createdfrom.internalidnumber', 'equalto', soId],
          'AND',
          ['class', 'anyof', itemClass],
          'AND',
          ['item.internalidnumber', 'equalto', woItem],
        ],
        columns: ['internalid', 'tranid'],
      });
      result = woSearch.run().getRange({ start: 0, end: 1 });
      log.debug(loggerTitle, result);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    return result && result.length
      ? {
          id: result[0].getValue('internalid'),
          tranid: result[0].getValue('tranid'),
        }
      : null;
  };
  /**
   * Adds a component line to the specified Work Order
   * @param {string} woId - Work Order internal ID
   * @param {string} itemId - Component Item internal ID
   * @param {number} quantity - Component quantity
   * @param {string} uom - Optional UOM
   * @param {string} desc - Optional Description
   * @returns {string|null} Updated WO ID or null
   */
  const addComponentToWorkOrder = (woId, itemId, quantity, uom, desc) => {
    const loggerTitle = 'Add Component To WorkOrder';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    let woRecId;
    try {
      log.debug(loggerTitle, { woId, itemId, quantity, uom, desc });
      //
      const woRec = record.load({
        type: 'workorder',
        id: woId,
        isDynamic: true,
      });
      woRec.selectNewLine({ sublistId: 'item' });
      woRec.setCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'item',
        value: itemId,
      });
      woRec.setCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'quantity',
        value: quantity,
      });

      if (uom && UOM_MAP[uom]) {
        woRec.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'units',
          value: UOM_MAP[uom],
        });
      } else if (uom) {
        log.error('Missing UOM Mapping', `UOM '${uom}' not found in map.`);
      }

      if (desc) {
        woRec.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'description',
          value: desc,
        });
      }

      woRec.commitLine({ sublistId: 'item' });
      woRecId = woRec.save();
      log.debug('Work Order Updated', `ID: ${woRecId}`);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    //
    return woRecId;
  };

  /**
   * Updates the custom work order detail record with the linked WO tranid
   * @param {string} recordId - ID of the custom record
   * @param {string} woTranid - Tranid of the matched WO
   */
  const updateCustomRecord = (recordId, woTranid) => {
    const loggerTitle = 'Update Custom Record';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    try {
      log.debug(loggerTitle, `Record ID: ${recordId},Wo Tran ID: ${woTranid}`);
      //
      record.submitFields({
        type: 'customrecord_as_workorder_details',
        id: recordId,
        values: { custrecord_as_so_workorder: woTranid },
      });
      //
      log.debug(loggerTitle, `Updated Custom Record Successfully.`);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
  };
  /**
   * Updates WO Item quantity on top-level work order
   * @param {string} woId - Work Order ID
   * @param {string} itemId - WO Item internal ID
   * @param {number} woQty - Quantity to update
   * @returns {string|null} Updated WO internal ID or null
   */
  const updateWOItemQty = (woId, itemId, woQty) => {
    const loggerTitle = 'Update WO Item Quantity';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    log.debug(loggerTitle, `woId: ${woId}, itemId: ${itemId}, qty: ${woQty}`);

    try {
      const woRec = record.load({
        type: record.Type.WORK_ORDER,
        id: woId,
        isDynamic: true,
      });

      const lineCount = woRec.getLineCount({ sublistId: 'item' });

      for (let i = 0; i < lineCount; i++) {
        const lineItemId = woRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i,
        });

        if (parseInt(lineItemId) === parseInt(itemId)) {
          woRec.selectLine({ sublistId: 'item', line: i });

          woRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: woQty,
          });

          woRec.commitLine({ sublistId: 'item' });

          const updatedId = woRec.save();
          log.debug(loggerTitle, `Updated WO ${updatedId} for item ${itemId}`);
          log.debug(
            loggerTitle,
            '|>--------------------' +
              loggerTitle +
              '-Exit--------------------<|'
          );
          return updatedId;
        }
      }

      log.error(loggerTitle, `Item ${itemId} not found in WO ${woId}`);
      return null;
    } catch (error) {
      log.error(`${loggerTitle} exception`, error);
      return null;
    }
  };

  //
  /* ------------------------ Helper Functions - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
