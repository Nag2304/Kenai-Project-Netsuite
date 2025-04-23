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
 * Nagendra Babu   04.21.2025      1.01        Fixed SSS_INVALID_SUBLIST_OPERATION by using item sublist and adding validation
 * Nagendra Babu   04.21.2025      1.02        Removed status check to allow updates in any status, fixed item lookup to use itemid
 * Nagendra Babu   04.21.2025      1.03        Updated item lookup to use name filter, added usage monitoring
 * Nagendra Babu   04.21.2025      1.04        Updated usage threshold to 9,000 for 10,000-unit Scheduled Script limit
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

define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {
  /* ------------------------ Global Constants - Begin ------------------------ */
  const SCRIPT_NAME = 'SCM | SS Update Sweeper Work Orders';
  const GENERIC_BROOM_ITEM_ID = '1119'; // SC-40-0000
  const VS_REVERSE_ITEM_ID = '3228'; // SC-70-0287
  const USAGE_THRESHOLD = 9000; // Warn if usage exceeds 90% of 10,000-unit limit
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

      // Log initial usage
      const scriptObj = runtime.getCurrentScript();
      log.debug({
        title: loggerTitle,
        details: `Initial governance units remaining: ${scriptObj.getRemainingUsage()}`,
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
        // Check usage after each Work Order
        const remainingUsage = scriptObj.getRemainingUsage();
        log.debug({
          title: loggerTitle,
          details: `Remaining governance units after WO ${wo.id}: ${remainingUsage}`,
        });
        if (remainingUsage < 10000 - USAGE_THRESHOLD) {
          log.audit({
            title: `${loggerTitle} - Usage Warning`,
            details: `Usage approaching limit: ${remainingUsage} units remaining`,
          });
        }
      });

      log.debug({
        title: loggerTitle,
        details: `Final governance units remaining: ${scriptObj.getRemainingUsage()}`,
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

  /* *********************** Get Item Internal ID - Begin *********************** */
  /**
   * Retrieves the internal ID of an item based on its item name.
   * @param {string} itemName - The name of the item (e.g., SC-40-0009)
   * @returns {string|null} The internal ID of the item, or null if not found
   */
  function getItemInternalId(itemName) {
    const loggerTitle = `${SCRIPT_NAME} - Get Item Internal ID`;
    try {
      if (!itemName) {
        log.error({
          title: loggerTitle,
          details: 'Item name is empty or undefined',
        });
        return null;
      }

      log.debug({
        title: loggerTitle,
        details: `Looking up internal ID for item name: ${itemName}`,
      });

      const itemSearch = search.create({
        type: search.Type.ITEM,
        filters: [['name', 'is', itemName]],
        columns: ['internalid', 'itemid'],
      });

      let internalId = null;
      let foundItemId = null;
      itemSearch.run().each((result) => {
        internalId = result.getValue('internalid');
        foundItemId = result.getValue('itemid');
        return false; // Stop after first result
      });

      if (internalId) {
        log.debug({
          title: loggerTitle,
          details: `Found internal ID: ${internalId} for item name: ${itemName}, itemid: ${foundItemId}`,
        });
      } else {
        log.error({
          title: loggerTitle,
          details: `No item found with item name: ${itemName}`,
        });
      }

      return internalId;
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: `Error looking up item internal ID: ${JSON.stringify(error)}`,
      });
      return null;
    }
  }
  /* *********************** Get Item Internal ID - End *********************** */

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

      // Log Work Order status for debugging
      const woStatus = woRecord.getValue({ fieldId: 'status' });
      log.debug({
        title: loggerTitle,
        details: `Work Order status: ${woStatus}`,
      });

      // First Update: Replace Generic Broom with Broom from custom field
      const broomItemName = woRecord.getValue({
        fieldId: 'custbody_scm_broom_for_sweeper',
      });
      log.debug({
        title: loggerTitle,
        details: `Broom item name from custbody_scm_broom_for_sweeper: ${
          broomItemName || 'None'
        }`,
      });

      let broomItemId = null;
      if (broomItemName) {
        broomItemId = getItemInternalId(broomItemName);
        log.debug({
          title: loggerTitle,
          details: `Retrieved internal ID: ${
            broomItemId || 'None'
          } for item name: ${broomItemName}`,
        });
      }

      let changesMade = false;
      if (broomItemId) {
        try {
          updateBroomItem(woRecord, broomItemId);
          changesMade = true;
        } catch (updateError) {
          log.error({
            title: `${loggerTitle} - Broom Update Error`,
            details: `Failed to update Broom item: ${JSON.stringify(
              updateError
            )}`,
          });
        }
      } else {
        log.audit({
          title: loggerTitle,
          details:
            'No valid Broom item ID found for custbody_scm_broom_for_sweeper; skipping Broom update',
        });
      }

      // Second Update: Remove V/S with Reverse item if applicable
      const includesVSReverse = woRecord.getValue({
        fieldId: 'custbody_scm_vs_reverse',
      });
      log.debug({
        title: loggerTitle,
        details: `Includes V/S with Reverse: ${includesVSReverse}`,
      });

      if (includesVSReverse) {
        try {
          removeVSReverseItem(woRecord);
          changesMade = true;
        } catch (vsError) {
          log.error({
            title: `${loggerTitle} - V/S Reverse Update Error`,
            details: `Failed to remove V/S Reverse item: ${JSON.stringify(
              vsError
            )}`,
          });
        }
      }

      // Third Update: Set Work Order Updated to TRUE only if changes were made
      if (changesMade) {
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
      } else {
        log.audit({
          title: loggerTitle,
          details: `No updates applied to Work Order ID: ${workOrderId}; skipping save`,
        });
      }
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: `Error processing Work Order: ${JSON.stringify(error)}`,
      });
    }
  }
  /* *********************** Process Work Order - End *********************** */

  /* *********************** Update Broom Item - Begin *********************** */
  /**
   * Replaces the generic Broom item with the specified Broom item at the item sublist.
   * @param {Object} woRecord - Work Order record in dynamic mode
   * @param {string} broomItemId - Internal ID of the Broom item to add
   * @returns {void}
   */
  function updateBroomItem(woRecord, broomItemId) {
    const loggerTitle = `${SCRIPT_NAME} - Update Broom Item`;
    const sublistId = 'item';
    try {
      // Get the current line count and validate sublist
      const lineCount = woRecord.getLineCount({ sublistId });
      log.debug({
        title: loggerTitle,
        details: `${sublistId} sublist has ${lineCount} lines`,
      });

      if (lineCount < 0) {
        log.error({
          title: loggerTitle,
          details: `Invalid line count for ${sublistId} sublist: ${lineCount}`,
        });
        return;
      }

      if (lineCount === 0) {
        log.audit({
          title: loggerTitle,
          details: `${sublistId} sublist is empty; adding new Broom item directly`,
        });
      }

      // Collect items in the sublist to avoid modifying during iteration
      const linesToRemove = [];
      const existingItems = [];
      for (let i = 0; i < lineCount; i++) {
        try {
          const itemId = woRecord.getSublistValue({
            sublistId,
            fieldId: 'item',
            line: i,
          });
          const normalizedItemId = String(itemId);
          existingItems.push({ line: i, itemId: normalizedItemId });
          if (normalizedItemId === GENERIC_BROOM_ITEM_ID) {
            linesToRemove.push(i);
          }
        } catch (lineError) {
          log.error({
            title: `${loggerTitle} - Line Access Error`,
            details: `Failed to access line ${i} in ${sublistId} sublist: ${JSON.stringify(
              lineError
            )}`,
          });
        }
      }
      log.debug({
        title: loggerTitle,
        details: `Existing items in ${sublistId} sublist: ${JSON.stringify(
          existingItems
        )}`,
      });

      // Remove generic Broom item(s) if found (in reverse order to avoid index issues)
      if (linesToRemove.length > 0) {
        linesToRemove.sort((a, b) => b - a); // Sort descending
        for (let line of linesToRemove) {
          try {
            log.debug({
              title: loggerTitle,
              details: `Attempting to remove line ${line} from ${sublistId} sublist`,
            });
            woRecord.selectLine({ sublistId, line });
            woRecord.removeLine({ sublistId, line });
            log.debug({
              title: loggerTitle,
              details: `Removed generic Broom item (ID: ${GENERIC_BROOM_ITEM_ID}) at line ${line}`,
            });
          } catch (removeError) {
            log.error({
              title: `${loggerTitle} - Remove Line Error`,
              details: `Failed to remove line ${line} from ${sublistId} sublist: ${JSON.stringify(
                removeError
              )}`,
            });
          }
        }
      } else {
        log.audit({
          title: loggerTitle,
          details: `Generic Broom item (ID: ${GENERIC_BROOM_ITEM_ID}) not found in ${sublistId} sublist`,
        });
      }

      // Validate broomItemId before adding
      if (!broomItemId || isNaN(parseInt(broomItemId))) {
        log.error({
          title: loggerTitle,
          details: `Invalid Broom item ID: ${broomItemId}; skipping addition`,
        });
        return;
      }

      // Add the new Broom item with quantity 1
      try {
        log.debug({
          title: loggerTitle,
          details: `Attempting to add new Broom item (ID: ${broomItemId}) to ${sublistId} sublist`,
        });
        woRecord.selectNewLine({ sublistId });
        woRecord.setCurrentSublistValue({
          sublistId,
          fieldId: 'item',
          value: broomItemId,
        });
        woRecord.setCurrentSublistValue({
          sublistId,
          fieldId: 'quantity',
          value: 1,
        });
        woRecord.commitLine({ sublistId });
        log.debug({
          title: loggerTitle,
          details: `Added Broom item (ID: ${broomItemId}) with quantity 1`,
        });
      } catch (addError) {
        log.error({
          title: `${loggerTitle} - Add Item Error`,
          details: `Failed to add new Broom item (ID: ${broomItemId}) to ${sublistId} sublist: ${JSON.stringify(
            addError
          )}`,
        });
        throw addError; // Re-throw to allow processWorkOrder to handle
      }
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
   * Removes the V/S with Reverse item (SC-70-0287, ID: 3228) from the item sublist.
   * @param {Object} woRecord - Work Order record in dynamic mode
   * @returns {void}
   */
  function removeVSReverseItem(woRecord) {
    const loggerTitle = `${SCRIPT_NAME} - Remove V/S Reverse Item`;
    const sublistId = 'item';
    try {
      const lineCount = woRecord.getLineCount({ sublistId });
      let vsReverseLine = -1;

      // Find the V/S with Reverse item (SC-70-0287, ID: 3228)
      for (let i = 0; i < lineCount; i++) {
        try {
          const itemId = woRecord.getSublistValue({
            sublistId,
            fieldId: 'item',
            line: i,
          });
          const normalizedItemId = String(itemId);
          if (normalizedItemId === VS_REVERSE_ITEM_ID) {
            vsReverseLine = i;
            break;
          }
        } catch (lineError) {
          log.error({
            title: `${loggerTitle} - Line Access Error`,
            details: `Failed to access line ${i} in ${sublistId} sublist: ${JSON.stringify(
              lineError
            )}`,
          });
        }
      }

      if (vsReverseLine !== -1) {
        try {
          log.debug({
            title: loggerTitle,
            details: `Attempting to remove V/S Reverse item at line ${vsReverseLine} from ${sublistId} sublist`,
          });
          woRecord.selectLine({ sublistId, line: vsReverseLine });
          woRecord.removeLine({ sublistId, line: vsReverseLine });
          log.debug({
            title: loggerTitle,
            details: `Removed V/S Reverse item (ID: ${VS_REVERSE_ITEM_ID}) at line ${vsReverseLine}`,
          });
        } catch (removeError) {
          log.error({
            title: `${loggerTitle} - Remove Line Error`,
            details: `Failed to remove V/S Reverse item at line ${vsReverseLine} from ${sublistId} sublist: ${JSON.stringify(
              removeError
            )}`,
          });
        }
      } else {
        log.audit({
          title: loggerTitle,
          details: `V/S Reverse item (ID: ${VS_REVERSE_ITEM_ID}) not found in ${sublistId} sublist`,
        });
      }
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: `Error removing V/S Reverse item: ${JSON.stringify(error)}`,
      });
    }
  }
  /* ------------------------- Helper Functions - End ------------------------- */

  /* ------------------------------ Exports Begin ----------------------------- */
  return {
    execute: execute,
  };
  /* ------------------------------- Exports End ------------------------------ */
});
