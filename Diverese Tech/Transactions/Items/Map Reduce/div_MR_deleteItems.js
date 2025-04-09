/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: div_MR_deleteItems.js
 * Script: DIV | MR Delete Items
 * Author           Date       Version               Remarks
 * nagendrababu 04.09.2025      1.00          Initial creation of script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'item',
      filters: [
        ['parent', 'anyof', '8798'],
        'AND',
        ['internalid', 'noneof', '8879', '8887'],
      ],
      columns: [
        search.createColumn({ name: 'itemid', label: 'Name' }),
        search.createColumn({ name: 'displayname', label: 'Display Name' }),
        search.createColumn({ name: 'salesdescription', label: 'Description' }),
        search.createColumn({ name: 'type', label: 'Type' }),
        search.createColumn({ name: 'baseprice', label: 'Base Price' }),
        search.createColumn({
          name: 'custitem_atlas_item_planner',
          label: 'Planner',
        }),
        search.createColumn({
          name: 'custitem_kescp_exclude_item',
          label: 'Exclude From Customer Portal',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */
  /**
   *
   * @param {object} mapContext
   */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Parse the search result
      var searchResult = JSON.parse(mapContext.value);
      log.debug(loggerTitle, searchResult);
      //

      record.delete({
        type: searchResult.recordType,
        id: searchResult.id,
      });
      //
      log.debug(loggerTitle, 'Successfully deleted item: ' + searchResult.id);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ----------------------------- Map Phase - End ---------------------------- */
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
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
