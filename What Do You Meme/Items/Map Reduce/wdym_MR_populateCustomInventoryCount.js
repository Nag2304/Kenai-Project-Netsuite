/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: wdym_MR_populateCustomInventoryCount.js
 * Script: WDYM | MR Populate Cust Inventory Count
 * Author           Date       Version               Remarks
 * nagendrababu 07.19.2025     1.00     Initial Creation of the Script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/record', 'N/format', 'N/search'], (record, format, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const loggerTitle = ' Get Input Data';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    log.debug(loggerTitle, ' Search Started');
    return { type: 'search', id: 'customsearch_wdym_mr_ss_whq_qty' };
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------- Map Phase - Begin ------------------------ */
  /**
   *
   * @param {object} mapContext
   * @returns {boolean}
   */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const results = JSON.parse(mapContext.value);
      log.debug(loggerTitle + ' MAP CONTEXT VALUES', results);
      //

      // Form Values
      if (results.values['internalid.inventoryLocation'].value === '115') {
        // Form Key
        const itemId = results.id;
        log.debug(loggerTitle, { itemId });
        //
        const reduceValues = {};
        reduceValues.location =
          results.values['internalid.inventoryLocation'].value;
        reduceValues.quantityOnHand = results.values.locationquantityonhand;

        log.debug(loggerTitle, reduceValues);
        //
        mapContext.write({
          key: itemId,
          value: reduceValues,
        });
      }

      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* ------------------------- Map Phase - End ------------------------ */
  //
  /* ------------------------- Reduce Phase - Begin ------------------------ */
  /**
   *
   * @param {object} reduceContext
   * @returns {boolean}
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Key & Value Pairs
      const key = reduceContext.key;
      log.debug(loggerTitle + ' Key', key);
      const values = reduceContext.values;
      log.debug(loggerTitle + ' Values', values);
      //
      const data = JSON.parse(values[0]);
      log.debug(loggerTitle + 'Data ', data);
      //
      const itemData = fetchExistingItem(key);
      log.debug(loggerTitle + ' Item Data ', itemData);
      if (itemData.length == 0) {
        createCustomRecordInventoryCount(key, data);
      } else {
        const customRecordId = itemData.id;
        const quanity = itemData.getValue('custrecord_wdym_invc_qty');
        log.debug(
          loggerTitle,
          `Update Mode: customRecordId: ${customRecordId} quantity:${quanity} QuantityOnHand:${data.quantityOnHand}`
        );
        if (quanity !== data.quantityOnHand) {
          const newQuantity = quanity + data.quantityOnHand;
          updateCustomRecordInventoryCount(newQuantity);
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* ------------------------- Reduce Phase - End ------------------------ */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   *
   * @param {object} summarizeContext
   */
  const summarize = (summarizeContext) => {
    const loggerTitle = 'Summarize Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      log.audit(
        loggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        loggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        loggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ------------------------- Helper Functions - Begin------------------------ */
  //
  /* *********************** fetchExistingItem - Begin *********************** */
  /**
   *
   * @param {Number} itemId
   */
  const fetchExistingItem = (itemId) => {
    const loggerTitle = ' Fetch Existing Item ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let results = [];
    try {
      const customInventorySearchResults = search.create({
        type: 'customrecord_wdym_inventory_count',
        columns: [
          'custrecord_wdym_invc_qty',
          'custrecord_wdym_invc_location',
          'custrecord_wdym_invc_item',
        ],
        filters: [
          {
            name: 'custrecord_wdym_invc_item',
            operator: 'anyof',
            values: itemId,
          },
        ],
      });
      results = customInventorySearchResults.run().getRange({
        start: 0,
        end: 1,
      });
      log.debug(loggerTitle, results.length);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return results.length > 0 ? results[0] : [];
  };
  /* *********************** fetchExistingItem - End *********************** */
  //
  /* *********************** createCustomRecordInventoryCount - Begin *********************** */
  /**
   *
   * @param {*} itemid
   * @param {*} param1
   */
  const createCustomRecordInventoryCount = (
    itemid,
    { location, quantityOnHand }
  ) => {
    const loggerTitle = ' Create Custom Record Inventory Count ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const wdymInventoryCountRecord = record.create({
        type: 'customrecord_wdym_inventory_count',
        isDynamic: true,
      });
      wdymInventoryCountRecord.setValue({
        fieldId: 'custrecord_wdym_invc_date',
        value: format.parse({ value: new Date(), type: format.Type.DATE }),
      });
      wdymInventoryCountRecord.setValue({
        fieldId: 'custrecord_wdym_invc_item',
        value: itemid,
      });
      wdymInventoryCountRecord.setValue({
        fieldId: 'custrecord_wdym_invc_qty',
        value: quantityOnHand,
      });
      wdymInventoryCountRecord.setValue({
        fieldId: 'custrecord_wdym_invc_location',
        value: location,
      });
      const customRecordId = wdymInventoryCountRecord.save();
      log.debug(loggerTitle, { customRecordId });
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /**
   *
   * @param {*} id
   * @param {*} qty
   */
  /* *********************** createCustomRecordInventoryCount - End *********************** */
  //
  /* *********************** updateCustomRecordInventoryCount - Begin *********************** */
  /**
   *
   * @param {*} id
   * @param {*} qty
   */
  const updateCustomRecordInventoryCount = (id, qty) => {
    const loggerTitle = 'Update CustomRecord InventoryCount';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      record.submitFields({
        type: 'customrecord_wdym_inventory_count',
        id: id,
        values: {
          custrecord_wdym_invc_qty: qty,
        },
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* *********************** updateCustomRecordInventoryCount - End *********************** */
  //
  /* ------------------------- Helper Functions - End------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
