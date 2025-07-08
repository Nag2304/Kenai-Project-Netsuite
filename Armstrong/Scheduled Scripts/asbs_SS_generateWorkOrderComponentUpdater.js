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
      const detailRecords = getWorkOrderDetailRecords();
      log.debug(loggerTitle + ' Detail Records ', detailRecords);
      //
      detailRecords.forEach(processDetailRecord);
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
  const getWorkOrderDetailRecords = () => {
    const loggerTitle = 'Get Work Order Detail Records';
    const results = [];
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    try {
      const detailSearch = search.create({
        type: 'customrecord_as_workorder_details',
        filters: ['custrecord_as_so_workorder', 'is', 'empty'],
        columns: [
          'custrecord_sc_job_number',
          'custrecord_as_item_class',
          'custrecord_as_component',
          'custrecord_as_comp_qty',
          'custrecord_as_comp_uom',
          'custrecord_as_comp_desc',
          'custrecord_as_so_workorder',
        ],
      });
      log.debug(loggerTitle, detailSearch);

      detailSearch.run().each((result) => {
        results.push(result);
        return true;
      });
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
      log.debug(loggerTitle + ' Result ', result);
      const jobNumber = result.getValue('custrecord_sc_job_number');
      const itemClass = result.getValue('custrecord_as_item_class');
      const componentItem = result.getValue('custrecord_as_component');
      const componentQty =
        parseFloat(result.getValue('custrecord_as_comp_qty')) || 1;
      const componentUOM = result.getValue('custrecord_as_comp_uom');
      const componentDesc = result.getValue('custrecord_as_comp_desc');
      const recordId = result.id;

      const soId = findSalesOrderId(jobNumber);
      log.debug(loggerTitle, `SO ID: ${soId}`);
      if (!soId) return;

      const woInfo = findWorkOrderForSalesOrder(soId, itemClass);
      log.debug(loggerTitle, woInfo);
      if (!woInfo) return;

      const updatedId = addComponentToWorkOrder(
        woInfo.id,
        componentItem,
        componentQty,
        componentUOM,
        componentDesc
      );
      log.debug(loggerTitle, `Updated ID: ${updatedId}`);
      if (updatedId) {
        updateCustomRecord(recordId, woInfo.tranid);
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
  const findSalesOrderId = (jobNumber) => {
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
    return results.length > 0 ? results[0].getValue('internalid') : null;
  };

  /**
   * Finds a matching Work Order by SO ID and Class
   * @param {string} soId - Internal ID of Sales Order
   * @param {string} itemClass - Internal ID of Class
   * @returns {{id: string, tranid: string}|null}
   */
  const findWorkOrderForSalesOrder = (soId, itemClass) => {
    const loggerTitle = 'Find WorkOrder For SalesOrder';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    let results;
    try {
      const woSearch = search.create({
        type: 'workorder',
        filters: [
          ['createdfrom', 'anyof', soId],
          'AND',
          ['class', 'anyof', itemClass],
        ],
        columns: ['internalid', 'tranid'],
      });
      results = woSearch.run().getRange({ start: 0, end: 1 });
      log.debug(loggerTitle, results);
      if (results.length === 0) return null;
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
      return null;
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    return {
      id: results[0].getValue('internalid'),
      tranid: results[0].getValue('tranid'),
    };
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
          value: UOM_MAP[uom], //
        });
      } else {
        log.error(
          `${loggerTitle} Invalid UOM provided:`,
          `Unit "${uom}" not found in UOM_MAP.`
        );
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
      log.debug(loggerTitle, `Work Order Saved Successfully`);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
      return null;
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
        values: {
          custrecord_as_so_workorder: woTranid,
        },
      });
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
  //
  /* ------------------------ Helper Functions - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
