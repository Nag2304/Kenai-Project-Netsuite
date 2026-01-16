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

/*global define,log*/

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
      log.audit(
        loggerTitle,
        `Found ${detailRecords.length} unprocessed records`
      );

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
   * Retrieves unprocessed Work Order Details from customrecord_as_workorder_details
   * @returns {Array<Object>} Array of detail objects
   */
  const getUnprocessedDetails = () => {
    const loggerTitle = 'Get Unprocessed Details';
    log.audit(loggerTitle, '|>--- ENTRY ---<|');

    const columns = [
      'custrecord_sc_job_number',
      'custrecord_as_item',
      'custrecord_as_qty',
      'custrecord_as_item_class',
      'custrecord_as_sub_assy',
      'custrecord_as_sub_assy_uom',
      'custrecord_as_comp_uom',
      'custrecord_as_comp_desc',
      'custrecord_as_component',
      'custrecord_as_comp_qty',
      'custrecord_as_so_workorder',
      'custrecord_as_sub_workorder',
      'custrecord_as_mbs_xref',
    ].map((fieldId) => search.createColumn({ name: fieldId }));

    const results = search
      .create({
        type: 'customrecord_as_workorder_details',
        filters: null,
        columns: columns,
      })
      .run()
      .getRange({ start: 0, end: 1000 });

    const mappedResults = results.map((res) => ({
      id: res.id,
      jobNumber: res.getValue('custrecord_sc_job_number'),
      woItem: res.getValue('custrecord_as_item'),
      woQty: res.getValue('custrecord_as_qty'),
      itemClass: res.getValue('custrecord_as_item_class'),
      subAssembly: res.getValue('custrecord_as_sub_assy'),
      woUom: res.getValue('custrecord_as_sub_assy_uom'),
      compUom: res.getValue('custrecord_as_comp_uom'),
      compDesc: res.getValue('custrecord_as_comp_desc'),
      component: res.getValue('custrecord_as_component'),
      compQty: res.getValue('custrecord_as_comp_qty'),
      soWorkOrder: res.getValue('custrecord_as_so_workorder'),
      subAssyWorkOrder: res.getValue('custrecord_as_sub_workorder'),
      mbsXref: res.getValue('custrecord_as_mbs_xref'),
    }));

    log.audit(loggerTitle, `Retrieved ${mappedResults.length} records`);
    log.audit(loggerTitle, '|>--- EXIT ---<|');
    return mappedResults;
  };

  /**
   * Processes a single work order detail record
   * @param {Object} detail - Search result row
   */
  const processDetailRecord = (detail) => {
    const loggerTitle = 'Process Detail Record';
    log.debug(
      loggerTitle,
      `|>--------------------${loggerTitle}-Entry--------------------<|`
    );
    try {
      const {
        id,
        jobNumber,
        itemClass,
        woItem,
        woQty,
        subAssembly,
        component,
        compQty,
        compUom,
        compDesc,
      } = detail;

      log.debug(loggerTitle, `Processing detail ID: ${id}, Job#: ${jobNumber}`);

      const soId = findSalesOrder(jobNumber);
      if (!soId) {
        log.error(loggerTitle, `No Sales Order found for Job #: ${jobNumber}`);
        return;
      }

      let wo;
      if (subAssembly === 'T') {
        wo = findChildWorkOrder(soId, itemClass, woItem);
      } else {
        wo = findTopLevelWorkOrder(soId, itemClass, woItem);
      }

      if (!wo) {
        log.error(
          loggerTitle,
          `No matching Work Order found for detail ID: ${id}`
        );
        return;
      }

      const updatedId = addComponentToWorkOrder(
        wo.id,
        component,
        compQty,
        compUom,
        compDesc
      );

      if (updatedId) {
        updateCustomRecord(id, wo.tranid);
        log.audit(
          loggerTitle,
          `Updated Work Order ${wo.id} with component ${component}`
        );
      }
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

  // /**
  //  * Finds WO by Sales Order and Target Item ID (Column F logic)
  //  */
  // const findWorkOrderByItem = (soId, itemId) => {
  //   const loggerTitle = 'Find Work Order By Item';
  //   log.debug(
  //     loggerTitle,
  //     `|>--------------------${loggerTitle}-Entry--------------------<|`
  //   );
  //   let result;
  //   try {
  //     const woSearch = search.create({
  //       type: 'workorder',
  //       filters: [
  //         ['createdfrom.internalidnumber', 'equalto', soId],
  //         'AND',
  //         ['item.internalidnumber', 'equalto', itemId],
  //       ],
  //       columns: ['internalid', 'tranid'],
  //     });
  //     result = woSearch.run().getRange({ start: 0, end: 1 });
  //   } catch (error) {
  //     log.error(`${loggerTitle} caught with an exception`, error);
  //   }
  //   log.debug(
  //     loggerTitle,
  //     `|>--------------------${loggerTitle}-Exit--------------------<|`
  //   );
  //   return result && result.length
  //     ? {
  //         id: result[0].getValue('internalid'),
  //         tranid: result[0].getValue('tranid'),
  //       }
  //     : null;
  // };

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
