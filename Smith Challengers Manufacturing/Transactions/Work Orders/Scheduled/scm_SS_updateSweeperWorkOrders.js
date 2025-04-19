/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_SS_updateSweeperWorkOrders.js
 * Script: SCM | SS Update Sweeper Work Orders
 * Author           Date       Version               Remarks
 * Nagendra Babu   04.19.2025      1.00        Initial creation of the script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Purpose: Updates Sweeper Work Orders by replacing the generic Broom item with the item
 * specified in the Broom field, removing the V/S with Reverse item if applicable, and
 * marking the Work Order as updated.
 * Trigger: Scheduled execution to process all qualifying Work Orders.
 * Criteria:
 * - Sweeper Work Order field (custbody_scm_sweeper_order) is TRUE
 * - Work Order Updated field (custbody_scm_wo_updated) is FALSE
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define, log */

define(['N/record', 'N/search'], function (record, search) {
  /* ------------------------ Global Constants - Begin ------------------------ */
  const SCRIPT_NAME = 'SCM | SS Update Sweeper Work Orders';
  const GENERIC_BROOM_ITEM_ID = '1119'; // SC-40-0000
  const VS_REVERSE_ITEM_ID = '3228'; // SC-70-0287
  /* ------------------------- Global Constants - End ------------------------- */

  /* ------------------------- Execute Function - Begin ----------------------- */
  /**
   * Main entry point for the scheduled script.
   * Searches for qualifying Work Orders and processes updates.
   * @param {Object} context - Script context
   * @returns {void}
   */
  function execute(context) {
    const loggerTitle = `${SCRIPT_NAME} - Execute`;
    try {
      log.debug({
        title: loggerTitle,
        details: '|>------------------- Execute - Entry -------------------<|',
      });

      // Search for Work Orders where Sweeper Work Order is TRUE and Updated is FALSE
      const workOrders = getQualifyingWorkOrders();
      log.debug({
        title: loggerTitle,
        details: `Work Orders retrieved: ${JSON.stringify(workOrders)}`,
      });

      // Check if workOrders is defined and an array
      if (!Array.isArray(workOrders)) {
        log.error({
          title: `${loggerTitle} - Error`,
          details:
            'getQualifyingWorkOrders returned invalid or undefined result',
        });
        return;
      }

      log.debug({
        title: loggerTitle,
        details: `Found ${workOrders.length} qualifying Work Orders`,
      });

      // Process each Work Order
      workOrders.forEach((wo) => {
        processWorkOrder(wo.id);
      });

      log.debug({
        title: loggerTitle,
        details: '|>------------------- Execute - Exit -------------------<|',
      });
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: `Error in execute: ${JSON.stringify(error)}`,
      });
    }
  }
  /* -------------------------- Execute Function - End ------------------------ */

  /* ------------------------ Helper Functions - Begin ------------------------ */

  /* *********************** Get Qualifying Work Orders - Begin *********************** */
  /**
   * Searches for Work Orders that meet the criteria (Sweeper Work Order = TRUE, Updated = FALSE).
   * @returns {Array} Array of objects containing Work Order IDs
   */
  function getQualifyingWorkOrders() {
    const loggerTitle = `${SCRIPT_NAME} - Get Qualifying Work Orders`;
    const workOrders = [];

    try {
      const filters = [
        ['custbody_scm_sweeper_order', 'is', 'T'],
        'AND',
        ['custbody_scm_wo_updated', 'is', 'F'],
        'AND',
        ['mainline', 'is', 'T'], // Ensure we get the main record
      ];
      log.debug({
        title: loggerTitle,
        details: `Search filters: ${JSON.stringify(filters)}`,
      });

      const woSearch = search.create({
        type: search.Type.WORK_ORDER,
        filters: filters,
        columns: ['internalid'],
      });

      woSearch.run().each((result) => {
        workOrders.push({
          id: result.getValue('internalid'),
        });
        return true; // Continue iteration
      });

      log.debug({
        title: loggerTitle,
        details: `Retrieved ${workOrders.length} Work Orders`,
      });
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: `Error executing search: ${JSON.stringify(error)}`,
      });
      return workOrders; // Return empty array to prevent undefined
    }

    return workOrders;
  }
  /* *********************** Get Qualifying Work Orders - End *********************** */

  /* *********************** Process Work Order - Begin *********************** */
  /**
   * Processes a single Work Order by applying the required updates.
   * @param {string} workOrderId - Internal ID of the Work Order
   * @returns {void}
   */
  function processWorkOrder(workOrderId) {
    const loggerTitle = `${SCRIPT_NAME} - Process Work Order ${workOrderId}`;
    try {
      log.debug({
        title: loggerTitle,
        details: `Processing Work Order ID: ${workOrderId}`,
      });

      // Load the Work Order record
      const woRecord = record.load({
        type: record.Type.WORK_ORDER,
        id: workOrderId,
        isDynamic: true,
      });

      // First Update: Replace Generic Broom with Broom from custom field
      const broomItemId = woRecord.getValue({
        fieldId: 'custbody_scm_broom_for_sweeper',
      });
      if (broomItemId) {
        updateBroomItem(woRecord, broomItemId);
      } else {
        log.audit({
          title: loggerTitle,
          details: 'No Broom item specified in custbody_scm_broom_for_sweeper',
        });
      }

      // Second Update: Remove V/S with Reverse item if applicable
      const includesVSReverse = woRecord.getValue({
        fieldId: 'custbody_scm_vs_reverse',
      });
      if (includesVSReverse) {
        removeVSReverseItem(woRecord);
      }

      // Third Update: Set Work Order Updated to TRUE
      woRecord.setValue({
        fieldId: 'custbody_scm_wo_updated',
        value: true,
      });

      // Save the Work Order
      const savedId = woRecord.save({
        ignoreMandatoryFields: false,
      });
      log.audit({
        title: loggerTitle,
        details: `Successfully updated Work Order ID: ${savedId}`,
      });
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: error,
      });
    }
  }
  /* *********************** Process Work Order - End *********************** */

  /* *********************** Update Broom Item - Begin *********************** */
  /**
   * Replaces the generic Broom item with the specified Broom item at the component level.
   * @param {Object} woRecord - Work Order record in dynamic mode
   * @param {string} broomItemId - Internal ID of the Broom item to add
   * @returns {void}
   */
  function updateBroomItem(woRecord, broomItemId) {
    const loggerTitle = `${SCRIPT_NAME} - Update Broom Item`;
    try {
      // Get the current line count and log sublist state
      const lineCount = woRecord.getLineCount({ sublistId: 'component' });
      log.debug({
        title: loggerTitle,
        details: `Component sublist has ${lineCount} lines`,
      });

      if (lineCount <= 0) {
        log.audit({
          title: loggerTitle,
          details: 'Component sublist is empty; adding new Broom item directly',
        });
      }

      // Collect items in the sublist to avoid modifying during iteration
      const linesToRemove = [];
      const existingItems = [];
      for (let i = 0; i < lineCount; i++) {
        const itemId = woRecord.getSublistValue({
          sublistId: 'component',
          fieldId: 'item',
          line: i,
        });
        existingItems.push({ line: i, itemId: itemId });
        if (itemId === GENERIC_BROOM_ITEM_ID) {
          linesToRemove.push(i);
        }
      }
      log.debug({
        title: loggerTitle,
        details: `Existing items: ${JSON.stringify(existingItems)}`,
      });

      // Remove generic Broom item(s) if found (in reverse order to avoid index issues)
      if (linesToRemove.length > 0) {
        linesToRemove.sort((a, b) => b - a); // Sort descending
        linesToRemove.forEach((line) => {
          woRecord.removeLine({
            sublistId: 'component',
            line: line,
          });
          log.debug({
            title: loggerTitle,
            details: `Removed generic Broom item (ID: ${GENERIC_BROOM_ITEM_ID}) at line ${line}`,
          });
        });
      } else {
        log.audit({
          title: loggerTitle,
          details: `Generic Broom item (ID: ${GENERIC_BROOM_ITEM_ID}) not found`,
        });
      }

      // Add the new Broom item with quantity 1
      woRecord.selectNewLine({ sublistId: 'component' });
      woRecord.setCurrentSublistValue({
        sublistId: 'component',
        fieldId: 'item',
        value: broomItemId,
      });
      woRecord.setCurrentSublistValue({
        sublistId: 'component',
        fieldId: 'quantity',
        value: 1,
      });
      woRecord.commitLine({ sublistId: 'component' });

      log.debug({
        title: loggerTitle,
        details: `Added Broom item (ID: ${broomItemId}) with quantity 1`,
      });
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: `Error updating Broom item: ${JSON.stringify(error)}`,
      });
      throw error; // Re-throw to ensure processWorkOrder logs the error
    }
  }
  /* *********************** Update Broom Item - End *********************** */

  /* *********************** Remove V/S Reverse Item - Begin *********************** */
  /**
   * Removes the V/S with Reverse item (SC-70-0287, ID: 3228) from the component sublist.
   * @param {Object} woRecord - Work Order record in dynamic mode
   * @returns {void}
   */
  function removeVSReverseItem(woRecord) {
    const loggerTitle = `${SCRIPT_NAME} - Remove V/S Reverse Item`;
    try {
      const lineCount = woRecord.getLineCount({ sublistId: 'component' });
      let vsReverseLine = -1;

      // Find the V/S with Reverse item (SC-70-0287, ID: 3228)
      for (let i = 0; i < lineCount; i++) {
        const itemId = woRecord.getSublistValue({
          sublistId: 'component',
          fieldId: 'item',
          line: i,
        });
        if (itemId === VS_REVERSE_ITEM_ID) {
          vsReverseLine = i;
          break;
        }
      }

      if (vsReverseLine !== -1) {
        woRecord.removeLine({
          sublistId: 'component',
          line: vsReverseLine,
        });
        log.debug({
          title: loggerTitle,
          details: `Removed V/S Reverse item (ID: ${VS_REVERSE_ITEM_ID}) at line ${vsReverseLine}`,
        });
      } else {
        log.audit({
          title: loggerTitle,
          details: `V/S Reverse item (ID: ${VS_REVERSE_ITEM_ID}) not found`,
        });
      }
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: error,
      });
    }
  }
  /* *********************** Remove V/S Reverse Item - End *********************** */

  /* ------------------------- Helper Functions - End ------------------------- */

  /* ------------------------------ Exports Begin ----------------------------- */
  return {
    execute: execute,
  };
  /* ------------------------------- Exports End ------------------------------ */
});
