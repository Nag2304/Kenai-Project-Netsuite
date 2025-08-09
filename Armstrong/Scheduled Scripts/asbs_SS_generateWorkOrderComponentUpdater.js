/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/**
 * File name: asbs_SS_generateWorkOrderComponentUpdater.js
 * Script: ASBS | SS WO Component Updater
 * Author: nagendrababu
 * Date: 07.08.2025
 * Version: 1.01
 * Remarks: Updated to handle new "Target WO Item" requirement from Column F
 */

define(['N/search', 'N/record'], (search, record) => {
  const exports = {};

  /**
   * Map of UOM Names to Internal IDs
   */
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

  /**
   * Entry point for Scheduled Script
   * @param {Object} context - Script context
   */
  const execute = (context) => {
    const loggerTitle = 'Execute';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    try {
      const detailRecords = getUnprocessedDetails();
      detailRecords.forEach(processDetailRecord);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
    return true;
  };

  /**
   * Retrieves all unprocessed work order detail records from the custom table.
   * @returns {Array} Search results
   */
  const getUnprocessedDetails = () => {
    const loggerTitle = 'Get Un Processed Details';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    const results = [];
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
          'custrecord_as_target_wo_item', // NEW COLUMN for Column F
        ],
      });
      detailSearch.run().each((result) => {
        results.push(result);
        return true;
      });
      log.debug(loggerTitle, `Results Length: ${results.length}`);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
    return results;
  };

  /**
   * Processes a single work order detail record
   * @param {Object} result - Search result row
   */
  const processDetailRecord = (result) => {
    const loggerTitle = 'Process Detail Record';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    try {
      const jobNumber = result.getValue('custrecord_sc_job_number');
      const itemClass = result.getValue('custrecord_as_item_class');
      const woItem = result.getValue('custrecord_as_item');
      const woQty = parseFloat(result.getValue('custrecord_as_qty')) || 1;
      const isSubAssembly = result.getValue('custrecord_as_sub_assy') === 'T';
      const componentItem = result.getValue('custrecord_as_component');
      const componentQty =
        parseFloat(result.getValue('custrecord_as_comp_qty')) || 1;
      const componentUom = result.getValue('custrecord_as_comp_uom');
      const componentDesc = result.getValue('custrecord_as_comp_desc');
      const targetWoItem = result.getValue('custrecord_as_target_wo_item');
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
        targetWoItem,
      });

      const soId = findSalesOrder(jobNumber);
      if (!soId) {
        log.error(loggerTitle, `No Sales Order found for Job #: ${jobNumber}`);
        return;
      }

      let wo;
      if (targetWoItem) {
        // New logic: Find WO by target item ID from Column F
        wo = findWorkOrderByItem(soId, targetWoItem);
      } else if (isSubAssembly) {
        wo = findChildWorkOrder(soId, itemClass, woItem);
      } else {
        wo = findTopLevelWorkOrder(soId, itemClass, woItem);
      }

      if (!wo) {
        log.error(
          loggerTitle,
          `No matching Work Order found for record ${recordId}`
        );
        return;
      }
      log.debug(loggerTitle, `Work Order Found: ${JSON.stringify(wo)}`);

      // Always add component line for both cases (original logic modified)
      const updatedId = addComponentToWorkOrder(
        wo.id,
        componentItem,
        componentQty,
        componentUom,
        componentDesc
      );

      if (updatedId) updateCustomRecord(recordId, wo.tranid);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
  };

  /**
   * Finds Sales Order internal ID using Job #
   * @param {string} jobNumber
   * @returns {string|null} SO internal ID
   */
  const findSalesOrder = (jobNumber) => {
    const loggerTitle = 'Find Sales Order Id';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    let results;
    try {
      const soSearch = search.create({
        type: 'salesorder',
        filters: [['tranid', 'is', jobNumber]],
        columns: ['internalid'],
      });
      results = soSearch.run().getRange({ start: 0, end: 1 });
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
    return results && results.length ? results[0].getValue('internalid') : null;
  };

  /**
   * Finds top-level WO by Sales Order, Class, and Item
   */
  const findTopLevelWorkOrder = (soId, itemClass, woItem) => {
    const loggerTitle = 'Find Top Level Work Order';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    let result;
    try {
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
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
    return result && result.length
      ? {
          id: result[0].getValue('internalid'),
          tranid: result[0].getValue('tranid'),
        }
      : null;
  };

  /**
   * Finds child WO by Sales Order, Class, and Item
   */
  const findChildWorkOrder = (soId, itemClass, woItem) => {
    const loggerTitle = 'Find Child Work Order';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    let result;
    try {
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
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
    return result && result.length
      ? {
          id: result[0].getValue('internalid'),
          tranid: result[0].getValue('tranid'),
        }
      : null;
  };

  /**
   * Finds WO by Sales Order and Target Item ID (Column F logic)
   */
  const findWorkOrderByItem = (soId, itemId) => {
    const loggerTitle = 'Find Work Order By Item';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    let result;
    try {
      const woSearch = search.create({
        type: 'workorder',
        filters: [
          ['createdfrom.internalidnumber', 'equalto', soId],
          'AND',
          ['item.internalidnumber', 'equalto', itemId],
        ],
        columns: ['internalid', 'tranid'],
      });
      result = woSearch.run().getRange({ start: 0, end: 1 });
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
    return result && result.length
      ? {
          id: result[0].getValue('internalid'),
          tranid: result[0].getValue('tranid'),
        }
      : null;
  };

  /**
   * Adds a component to a WO
   */
  const addComponentToWorkOrder = (woId, itemId, quantity, uom, desc) => {
    const loggerTitle = 'Add Component To WorkOrder';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    let woRecId;
    try {
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
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
    return woRecId;
  };

  /**
   * Updates custom record with WO TranID
   */
  const updateCustomRecord = (recordId, woTranid) => {
    const loggerTitle = 'Update Custom Record';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    try {
      record.submitFields({
        type: 'customrecord_as_workorder_details',
        id: recordId,
        values: { custrecord_as_so_workorder: woTranid },
      });
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Exit--------------------<|`
    );
  };

  exports.execute = execute;
  return exports;
});
