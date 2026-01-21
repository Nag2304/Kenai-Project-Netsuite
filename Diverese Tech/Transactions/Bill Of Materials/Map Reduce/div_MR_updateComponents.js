/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: div_MR_updateComponents.js
 * Script: DIV | MR Update Components
 * Author           Date       Version               Remarks
 * nagendrababu 01.19.2026      1.00        Initial creation of script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/*This Map/Reduce script finds all BOM Revisions that contain specific
* component item internal IDs and sets their BOM Quantity (bomquantity)
* to 0 at the line level.
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /**
   * List of component item internal IDs that must be updated.
   * @type {string[]}
   */
  const TARGET_COMPONENT_IDS = [
    '3548',
    '3549',
    '3550',
    '3551',
    '3552',
    '3553',
    '3554',
    '3555',
  ];
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  /**
   * Creates the input search that returns BOM Revision records
   * containing any of the target component items.
   *
   * @returns {search.Search} NetSuite search object
   */
  const getInputData = () => {
    return search.create({
      type: 'bomrevision',
      filters: [
        ['isinactive', 'is', 'F'],
        'AND',
        ['component.item', 'anyof', TARGET_COMPONENT_IDS],
      ],
      columns: [search.createColumn({ name: 'internalid' })],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */

  /**
   * Emits BOM Revision internal IDs as keys for the reduce stage.
   *
   * @param {Object} context
   * @param {string} context.key - Search result index
   * @param {string} context.value - Search result JSON string
   */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const result = JSON.parse(mapContext.value);

      const revisionId = result.id;

      mapContext.write({
        key: revisionId,
        value: revisionId,
      });
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
  /* -------------------------- Reduce Phase - Begin -------------------------- */
  /**
   * Loads each BOM Revision record and sets bomquantity = 0
   * for matching component item lines.
   *
   * @param {Object} context
   * @param {string} context.key - BOM Revision internal ID
   * @param {string[]} context.values - Duplicate keys (ignored)
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    const revisionId = reduceContext.key;
    try {
      const bomRevisionRecord = record.load({
        type: 'bomrevision',
        id: revisionId,
        isDynamic: false,
      });

      const lineCount = bomRevisionRecord.getLineCount({
        sublistId: 'component',
      });

      let isUpdated = false;

      for (let line = 0; line < lineCount; line += 1) {
        const itemId = bomRevisionRecord.getSublistValue({
          sublistId: 'component',
          fieldId: 'item',
          line,
        });

        if (TARGET_COMPONENT_IDS.includes(String(itemId))) {
          bomRevisionRecord.setSublistValue({
            sublistId: 'component',
            fieldId: 'bomquantity',
            line,
            value: 0,
          });

          isUpdated = true;
        }
      }

      if (isUpdated) {
        bomRevisionRecord.save({
          ignoreMandatoryFields: true,
        });

        log.audit('BOM Revision Updated', {
          revisionId,
          message: 'BOM quantity set to 0 for target components.',
        });
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
  /* --------------------------- Reduce Phase - End --------------------------- */
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
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
