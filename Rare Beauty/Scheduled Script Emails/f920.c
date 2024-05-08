ID I4200310_ValidateAndGetDefaults1(LPBHVRCOM lpBhvrCom, 
                                    LPVOID lpVoid,
                                    HUSER hUser,
                                    LPDSD4200310H lpDS,
                                    LPDS4200310A lpds4200310,
                                    LPDS4200310M lpds4200310M,
                                    LPDS4200310L lpDS4200310L)
{
  /************************************************************************
   *  Variable declarations
   ************************************************************************/
   ID             idReturnCode            = ER_SUCCESS;  /* Return Code */
   ID             idErrorFlag             = 0;
   ID             idReturnValue           = ER_SUCCESS;  /* SAR 8707537 */  
   /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ START
 * Ibstock Bricks modification P227T003EUB - Upgrade - Bundle 1 - Task 3
 * David Macek		14.06.2013					*/
   ID             idMABReturnValue = ER_SUCCESS;	/* Ibstock Mod for Issue 2636 STAR 312.034.DD by MAB 6/7/06 */
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@ END					*/

   BOOL           bAddressChanged         = FALSE;       /* SAR 8374058 */ 

   JCHAR          cReturnValue            = _J('0');

   JCHAR          szSoldToCertificate[21] = {0};
   MATH_NUMERIC   mnTwo                   = {0};         /* Mobile Sales */

   short          nAddressNoFlag          = 0;  /* 0 - AN8  =  0 & SHAN  = 0
                                                   1 - AN8 !=  0 & SHAN  = 0
                                                   2 - AN8  =  0 & SHAN != 0
                                                   3 - AN8 !=  0 & SHAN != 0 */

  /************************************************************************
   * Business Function structures
   ************************************************************************/
   DSD4000880 dsD4000880            = {0};   /* Verify And Get F0101 For GOP */
   DSD4200100 dsD4200100            = {0};   /* Get Sold To Billing Instructions */
   DSD4200140 dsD4200140            = {0};   /* Get Ship To Billing Instructions */
   DS4200310N dsGetF03012Internal   = {0};   /* SAR 8750451 */

	 /*
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   Begin DWS  P273T001CRA     Zayne Julius      5-Mar-2015
   Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   */

   ID idSoldShipReturnValue = ER_SUCCESS;
   JCHAR cSoldToOrShipToDefault = _J('0');

   /*
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   End DWS  P273T001CRA     Zayne Julius      5-Mar-2015
   Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   */

   /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ START
	* Ibstock Bricks modification P227T003EUB - Upgrade - Bundle 1 - Task 3
	* David Macek		14.06.2013			Replace D0100042 with D4200140		*/
	/* DWS.262.006.DD    Lee Balsom   */
	/* DSD0100042 dsD0100042SoldTo	= {0};	*/
   DSD4200140	dsD4200140SoldTo = { 0 };		/* Initialised here, the init logic from Xe not upgraded */

   ID			idDWSReturnCode = ER_SUCCESS;	/* Variable added not to interfere with existing variables */

   /*********************************************************************/
   /* Ibstock Mod for Issue 2636 STAR 312.034.DD by MAB 6/7/06          */
   /* This structure is used by the GetUDC bsfn, which we are now using */
   /* to determine if an order is a "sample" order (using the special-  */
   /* handling code for UDC 00/DT) in the code below.                   */
   /*********************************************************************/
   DSD0005	dsD0005 = { 0 };
   /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ END					*/

  /************************************************************************
   * Main Processing
   ************************************************************************/
   ParseNumericString (&mnTwo, _J("2")); /* Mobile Sales */

  /*-----------------------------------------------------------------
   * If the 'Sold To' Address No. is not zero then validate that 
   * against XF0301 'VerifyAndGetF0101ForOP(B4000880.c) and do the 
   * same for 'Ship To' address #
   *----------------------------------------------------------------*/
   if (MathZeroTest(&lpDS->mnAddressNumber))
   {
      nAddressNoFlag   =   1;

      memset((void *)(&dsD4000880),(int)(_J('\0')),sizeof(dsD4000880));
      MathCopy(&dsD4000880.mnAddressNumber,&lpDS->mnAddressNumber);
      dsD4000880.cSuppressError =_J('1');

      idReturnCode    = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                     NULL,lpBhvrCom,lpVoid,(LPVOID)&dsD4000880,
                                     (CALLMAP *)NULL,(int)0,(JCHAR *)NULL,
                                     (JCHAR *)NULL,(int)0);
       
      if ((idReturnCode  == ER_SUCCESS) &&
          (IsStringBlank(dsD4000880.szErrorMessage)) && /* Mobile Sales */
          (MathCompare(&dsD4000880.mnSynchronizationStatus, &mnTwo) <= 0)) /* Mobile Sales */
      {
        /* SAR 2323250 */
         jdeStrcpy((JCHAR *)lpds4200310->szSoldToBranchPlant,
                   (const JCHAR *)dsD4000880.szBranchPlant);

        /* SAR 3290891 */
         jdeStrcpy((JCHAR *)lpds4200310->szLanguagePreference,               
                   (const JCHAR *)dsD4000880.szLanguagePreference);

        /* SAR 6348471 */
         jdeStrcpy((JCHAR *)(szSoldToCertificate),
                   (const JCHAR *)(dsD4000880.szTaxCertificate));

         MathCopy(&dsD4200100.mnSoldToAddress,&lpDS->mnAddressNumber);

         if (IsStringBlank(lpDS->szWKCreditMesg))   /* SAR 8054783 */
         {
            jdeStrcpy((JCHAR *)(lpDS->szWKCreditMesg),(const JCHAR *)(dsD4000880.szCreditMessage)); 
         }

        /* SAR 5571591 */
        /* SAR 6043693 */
         if (lpDS->cWKSourceOfData == _J('4')) 
         {
            if (IsStringBlank(lpDS->szOrderCo))
            {
               idReturnCode= I4200310_CallRetrieveCoFromMCU(lpBhvrCom, lpVoid,
                                                            dsD4000880.szBranchPlant,
                                                            dsD4200100.szCompany);
            }
            else
            {
               jdeStrcpy((JCHAR *)dsD4200100.szCompany, (const JCHAR *)lpDS->szOrderCo);
            } /* SAR 5566791 */
         }
         else
         {
           /* LOB */
            jdeStrcpy((JCHAR *)dsD4200100.szCompany, (const JCHAR *)lpDS->szOrderCo);
         }
        /* SAR 6043693 */
        /* SAR 5571591 */
         
        /* If the processing option is set to 1 we need to use the company for the branch plant set for shipTo address */
         if ((lpds4200310->cPODefaultShipToBranch == _J('1')) && (IsStringBlank(lpDS->szBusinessUnit)))
         {
           /* if shipto address is entered on the screen */
            if (MathZeroTest(&lpDS->mnShipToNo))
            {
               memset((void *)(&dsD4000880), (int)(_J('\0')), sizeof(dsD4000880));
               MathCopy(&dsD4000880.mnAddressNumber, &lpDS->mnShipToNo);
            
               idReturnCode = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                            NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4000880,
                                            (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                            (JCHAR *)NULL, (int)0);
            
               if ((idReturnCode == ER_SUCCESS) &&
                   (IsStringBlank(dsD4000880.szErrorMessage)) &&
                   (IsStringBlank(dsD4200100.szCompany)) && /* Mobile Sales */
                   (MathCompare(&dsD4000880.mnSynchronizationStatus, &mnTwo) <= 0)) /* Mobile Sales */
               {
                 /* The branch plant for the Ship to address is used to fetch the company. This 
                  * company will be used when fetching the sold to default payment type etc. 
                  */
                  idReturnCode = I4200310_CallRetrieveCoFromMCU(lpBhvrCom, lpVoid,
                                                                dsD4000880.szBranchPlant,
                                                                dsD4200100.szCompany);
               }
            }
            else
            {
              /* SAR 5990509 */
               idReturnCode = jdeCallObject(_J("GetSoldToBillingInstructions"),
                                            NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4200100,
                                            (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                            (JCHAR *)NULL, (int)0);

              /* if shipto address is not entered on the screen, fetch it from the related address for the sold to */
               cReturnValue = I4200310_GetAddressNo(lpBhvrCom, lpVoid, lpds4200310, &dsD4000880,
                                                    &dsD4200100.mnRelatedAddressNum,
                                                    dsD4200100.cBillingAddressNumber,
                                                    &lpDS->mnShipToNo);
               if (cReturnValue != _J('3'))
               {
                  memset((void *)(&dsD4000880), (int)(_J('\0')), sizeof(dsD4000880));
                  MathCopy(&dsD4000880.mnAddressNumber, &lpDS->mnShipToNo);

                  idReturnCode = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                               NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4000880,
                                               (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                               (JCHAR *)NULL, (int)0);
            
                  if ((idReturnCode == ER_SUCCESS) &&
                      (IsStringBlank(dsD4000880.szErrorMessage)) &&
                      (IsStringBlank(dsD4200100.szCompany)) && /* Mobile Sales */
                      (MathCompare(&dsD4000880.mnSynchronizationStatus, &mnTwo) <= 0)) /* Mobile Sales */
                  {
                    /* The branch plant for the Ship to address is used to fetch the company. This 
                     * company will be used when fetching the sold to default payment type etc. 
                     */
                     idReturnCode = I4200310_CallRetrieveCoFromMCU(lpBhvrCom, lpVoid,
                                                                   dsD4000880.szBranchPlant,
                                                                   dsD4200100.szCompany);
                  }
               }
            }
         }
          
        /* If the processing option is set to 2 we need to use the company for the branch plant set 
         * for sold To address 
         */
         if ((lpds4200310->cPODefaultShipToBranch == _J('2')) && (IsStringBlank(lpDS->szBusinessUnit)))
         {
            if (IsStringBlank(dsD4200100.szCompany))
            {
               if (MathZeroTest(&dsD4200100.mnSoldToAddress)) 
               {
                 /* if soldto address is entered on the screen */
                  memset((void *)(&dsD4000880), (int)(_J('\0')), sizeof(dsD4000880));
                  MathCopy(&dsD4000880.mnAddressNumber, &dsD4200100.mnSoldToAddress);
                  
                  idReturnCode = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                               NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4000880,
                                               (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                               (JCHAR *)NULL, (int)0);
            
                  if ((idReturnCode == ER_SUCCESS) &&
                      (IsStringBlank(dsD4000880.szErrorMessage)) &&
                      (IsStringBlank(dsD4200100.szCompany)) && /* Mobile Sales */
                      (MathCompare(&dsD4000880.mnSynchronizationStatus, &mnTwo) <= 0)) /* Mobile Sales */
                  {
                    /* The branch plant for the Sold to address is used to fetch the company. This 
                     * company will be used when fetching the sold to default payment type etc. 
                     */
                     idReturnCode = I4200310_CallRetrieveCoFromMCU(lpBhvrCom, lpVoid,
                                                                   dsD4000880.szBranchPlant,
                                                                   dsD4200100.szCompany);

                    /* SAR 8252991 - Passes Company when lpDS->szOrderCo is blank */
                     if (IsStringBlank(lpDS->szOrderCo))
                     {
                        jdeStrcpy((JCHAR *)(lpDS->szOrderCo), (const JCHAR *)(dsD4200100.szCompany));
                     }
                    /* SAR 8252991 - Ends */
                  }
               }
               else
               {
                 /* if Soldto address is not entered on the screen, fetch it from the related address for the Ship to */
                  cReturnValue = I4200310_GetAddressNo(lpBhvrCom, lpVoid, lpds4200310, &dsD4000880,
                                                       &dsD4200100.mnRelatedAddressNum,
                                                       dsD4200100.cBillingAddressNumber,
                                                       &dsD4200100.mnSoldToAddress);

                  if (cReturnValue != _J('3'))
                  {
                     memset((void *)(&dsD4000880), (int)(_J('\0')), sizeof(dsD4000880));
                     MathCopy(&dsD4000880.mnAddressNumber, &dsD4200100.mnSoldToAddress);
                     
                     idReturnCode = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                                  NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4000880,
                                                  (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                                  (JCHAR *)NULL, (int)0);
               
                     if ((idReturnCode == ER_SUCCESS) &&
                         (IsStringBlank(dsD4000880.szErrorMessage)) &&
                         (IsStringBlank(dsD4200100.szCompany)) && /* Mobile Sales */
                         (MathCompare(&dsD4000880.mnSynchronizationStatus, &mnTwo) <= 0)) /* Mobile Sales */
                     {
                       /* The branch plant for the Sold to address is used to fetch the company. */
                        idReturnCode = I4200310_CallRetrieveCoFromMCU(lpBhvrCom, lpVoid,
                                                                      dsD4000880.szBranchPlant,
                                                                      dsD4200100.szCompany);
                     }
                  }
               }
            }
         }  /* SAR 5146519 Ends here */

         if ((!IsStringBlank(lpDS->szBusinessUnit)) && (IsStringBlank(lpDS->szOrderCo)))
         {
            idReturnCode = I4200310_CallRetrieveCoFromMCU(lpBhvrCom, lpVoid,
                                                          lpDS->szBusinessUnit,  
                                                          dsD4200100.szCompany);

            jdeStrcpy((JCHAR *)(lpDS->szOrderCo), (const JCHAR *)(dsD4200100.szCompany));
         }
   
         idReturnCode = jdeCallObject(_J("GetSoldToBillingInstructions"),
                                      NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4200100,
                                      (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                      (JCHAR *)NULL, (int)0);

         if ((idReturnCode  != ER_SUCCESS) ||
             ((dsD4200100.cBillingAddressNumber !=_J('B')) &&
              (dsD4200100.cBillingAddressNumber !=_J('X'))))
         {
            idErrorFlag   = 3;
            jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumber_103, _J("1020"));
         }
         else if (MathCompare(&dsD4200100.mnSynchronizationStatus, &mnTwo) > 0)  /* Mobile Sales */
         { 
            idErrorFlag   = 3; /* Mobile Sales */
            jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumber_103, _J("4210Z")); /* Mobile Sales */
         }


		 MathCopy(&dsD4200140SoldTo.mnShipToAddress, &lpDS->mnAddressNumber);

		 /* LOB */
		 jdeStrncpyTerminate(dsD4200140SoldTo.szCompany, dsD4200100.szCompany, DIM(dsD4200140SoldTo.szCompany));

		 /* dsD0100042SoldTo.cActionCode = _J('I');	* The new function does not have this parameter */
		 idDWSReturnCode = jdeCallObject(/*_J("MBFCustomerMaster")*/ _J("GetShipToBillingInstructions"), NULL, lpBhvrCom,
			 lpVoid, (LPVOID)&dsD4200140SoldTo,
			 (CALLMAP *)NULL, 0, (JCHAR *)NULL,
			 (JCHAR *)NULL, 0);

		 if ((idDWSReturnCode != ER_SUCCESS) /*(!IsStringBlank(dsD4200140SoldTo.szErrorMessageID))*/ ||
			 ((dsD4200140SoldTo.cBillingaddresstype != _J('B')) &&
			 (dsD4200140SoldTo.cBillingaddresstype != _J('X'))))
		 {
			 idErrorFlag = 3;
			 jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumber_103, _J("1020"));
		 }


		 /*BUG 28589733   Begin*/
		 /*
         if (IsStringBlank(lpDS->szPaymentTerm))
         {
            jdeStrcpy((JCHAR *)(lpDS->szPaymentTerm),(const JCHAR *)(&dsD4200100.szPaymentTerms));
         }
		  BUG 28589733 end*/
        /* SAR 8180472 - OFW Enhancement - pass sold to company to D4200310A */
         jdeStrcpy((JCHAR *)(lpds4200310->szOFWCompany), (const JCHAR *)(&dsD4200100.szCustomerMasterCompany));
      }
      else
      {
         idErrorFlag   = 3;

         if (MathZeroTest(&dsD4000880.mnSynchronizationStatus)) /* Mobile Sales */
         {
            jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumber_103, _J("4210Z"));
         }
         else
         {
            jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumber_103, _J("0037"));
         }
      }

   } /* end of if for AN8 != 0 */


   if (idErrorFlag == 3)
   {
      return idErrorFlag;
   }
     
   if (MathZeroTest(&lpDS->mnShipToNo))
   {
      if (nAddressNoFlag == 0)
      {
         nAddressNoFlag  = 2;
      }
      else
      {
         nAddressNoFlag  = 3;
      }

      memset((void *)(&dsD4000880), (int)(_J('\0')), sizeof(dsD4000880));
      MathCopy(&dsD4000880.mnAddressNumber, &lpDS->mnShipToNo);

      idReturnCode = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                   NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4000880,
                                   (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                   (JCHAR *)NULL, (int)0);

      if ((idReturnCode == ER_SUCCESS) &&
          (IsStringBlank(dsD4000880.szErrorMessage)) && /* Mobile Sales */
          (MathCompare(&dsD4000880.mnSynchronizationStatus, &mnTwo) <= 0)) /* Mobile Sales */
      {
        /* SAR 4625500 - change to Call MBFCustomerMaster to retrieve si01     */ 
         jdeStrcpy((JCHAR *)lpds4200310->szShipToBranchPlant, 
                   (const JCHAR *)dsD4000880.szBranchPlant);

         MathCopy(&dsD4200140.mnShipToAddress, &lpDS->mnShipToNo);
         
        /* LOB */
         jdeStrcpy((JCHAR *)dsD4200140.szCompany, 
                   (const JCHAR *)lpDS->szOrderCo);
        /*------------------------------------------------------------*/
        /* SAR 3180035 - Begin ADD                                    */
        /* If the P-Opt was set to default the B/P from the ShipTo    */
        /* Address, then retrieve the Company of that B/P.            */
        /*------------------------------------------------------------*/
         if ((lpds4200310->cPODefaultShipToBranch == _J('1')) &&
             (IsStringBlank(dsD4200140.szCompany)))
         {
            idReturnCode = I4200310_CallRetrieveCoFromMCU(lpBhvrCom, lpVoid,
                                                          dsD4000880.szBranchPlant,
                                                          dsD4200140.szCompany);
           /* SAR 8252991 - Begins */
            if (IsStringBlank(lpDS->szOrderCo))
            {
               jdeStrcpy((JCHAR *)(lpDS->szOrderCo),(const JCHAR *) (dsD4200140.szCompany));
            }
           /* SAR 8252991 - Ends */
         }

        /* SAR 3180035 - End ADD                                      */
         idReturnCode = jdeCallObject(_J("GetShipToBillingInstructions"), (LPFNBHVR) NULL, 
                                      lpBhvrCom, lpVoid, (LPVOID) &dsD4200140, 
                                      (CALLMAP *) NULL, 0, (JCHAR *) _J('\0'), 
                                      (JCHAR *) _J('\0'), 0);

        /* SAR 8931909 - Customer Set Tax Rate Area should populate from SHIP TO when address for tax is 1 */
         if (lpds4200310->cUseCustomerSet == _J('1') && nAddressNoFlag == 3)
         {
            if (lpDS->cWKSourceOfData == _J('4') && IsJDEDATENull(&lpDS->jdOrderDate))
            {
               memcpy((void *)(&lpDS->jdOrderDate), (const void *)(&lpDS->jdDateUpdated), sizeof(JDEDATE));
            }

            I4200310_DateSensitiveCustSets(lpBhvrCom, lpVoid, hUser, lpDS, NULL, &lpDS->jdOrderDate,
                                           lpds4200310->cUseCustomerSet);

           /* SAR 8932897 - Check for Blank to retain Manual overridden value */
            if ((lpDS->cAddressNumberForTax == _J('1')) && 
                (lpDS->cCMDocAction == _J('A')) && (IsStringBlank(lpDS->szTaxArea))) /* SAR 8939011 */
            {
               jdeStrcpy((JCHAR *)(lpDS->szTaxArea), (const JCHAR *)(dsD4200140.szTaxArea));

			   /* Bug 32081380 - Tax explanation code should always be retrieved from sold to */
			   /*Begin Bug 21401361*/
			   if (IsStringBlank(lpDS->szTaxExplanationCode))
			   {
				   jdeStrcpy((JCHAR *)(lpDS->szTaxExplanationCode), (const JCHAR *)(dsD4200100.szTaxExplainationCode));
			   }
			   /*End Bug 21401361*/
            }
         }
        /* SAR 8931909 - Ends */
         
         if ((idReturnCode != ER_SUCCESS) ||
             ((dsD4200140.cBillingaddresstype !=_J('S')) &&
              (dsD4200140.cBillingaddresstype !=_J('X'))))
         {
			 /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ START
  * Ibstock Bricks modification P227T003EUB - Upgrade - Bundle 1 - Task 3
  * David Macek		14.06.2013					*/
  /* Ibstock Mod for Issue 2636 STAR 312.034.DD by MAB 6/7/06  */
  /* If order is a sample and billing type is 5 (SPAR500), allow order */
  /* to be entered (ie don't give a hard error here)                   */
  /*********************************************************************/

  /* ***Comment out original code*** */
  /*

 idErrorFlag   = 3;
 jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("1020"));

  */

  /* ***Replace it with the following*** */

 /* We'll use the special-handling code from the UDC 00/DT for the order type, to */
 /* determine whether or not it's a sample order                                  */

			 memset((void *)(&dsD0005), (int)_J('\0'), sizeof(DSD0005));

			 jdeStrncpyTerminate((JCHAR *)(dsD0005.szSystemCode), (const JCHAR *)_J("00"), DIM(dsD0005.szSystemCode));
			 jdeStrncpyTerminate((JCHAR *)(dsD0005.szRecordTypeCode), (const JCHAR *)_J("DT"), DIM(dsD0005.szRecordTypeCode));
			 jdeStrncpyTerminate((JCHAR *)(dsD0005.szUserDefinedCode), (const JCHAR *)(lpDS->szOrderType), DIM(dsD0005.szUserDefinedCode));
			 ParseNumericString(&dsD0005.mnKeyFieldLength, _J("2"));
			 dsD0005.cSuppressErrorMessage = _J('1');

			 idMABReturnValue = jdeCallObject(_J("GetUDC"),
				 NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD0005,
				 (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
				 (JCHAR *)NULL, (int)0);

			 /* So now, if it's a sample order and billing-type is "5", we will not give the error msg. */
			 /* Otherwise, we will.                                                                     */


			 if (!(
				 (jdeStrcmp((JCHAR *)(dsD0005.szSpecialHandlingCode), (JCHAR *)_J("SAMPLE")) == 0)
				 &&
				 (dsD4200140.cBillingaddresstype == _J('5'))		/* Use dsD4200140 instead of dsD0100042 */
				 )
				 )
			 {

				 idErrorFlag = 3;
				 jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("1020"));
			 }
			 /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ END					*/
         }
         else if (MathCompare(&dsD4200140.mnSynchronizationStatus, &mnTwo) > 0)  /* Mobile Sales */
         {
            idErrorFlag   = 3;
            jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("4210Z"));
         }
      }
      else
      {
         idErrorFlag   = 3;

         if (MathZeroTest(&dsD4000880.mnSynchronizationStatus)) /* Mobile Sales */
         {
            jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("4210Z"));
         }
         else
         {
            jdeSetGBRError(lpBhvrCom, lpVoid, IDERRszLongAddressNumberShipto_102, _J("0037"));
         }
      }
   }  /* end of if for SHAN != 0 */

  /*----------------------------------------------------------------- 
   * If ship to address was not passed, find that out using the
   * sold to Related Add.# and call GetShipToBillingInstructions 
   *----------------------------------------------------------------*/
   if ((nAddressNoFlag == 1 ) &&
       (idErrorFlag < 3 ))
   {
      cReturnValue = I4200310_GetAddressNo(lpBhvrCom, lpVoid, lpds4200310, &dsD4000880,
                                           &dsD4200100.mnRelatedAddressNum,
                                           dsD4200100.cBillingAddressNumber,
                                           &lpDS->mnShipToNo);
      if (cReturnValue != _J('3'))
      {
        /*-----------------------------------------------------------
         * If the header branch is blank, get the header branch from
         * the Address Book
         *----------------------------------------------------------*/
         if ((IsStringBlank(lpDS->szBusinessUnit)))
         {
            memset((void *)(&dsD4000880),(int)(_J('\0')),sizeof(dsD4000880));

            MathCopy(&dsD4000880.mnAddressNumber,&lpDS->mnShipToNo);

            idReturnCode = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                         NULL,lpBhvrCom,lpVoid,(LPVOID)&dsD4000880,
                                         (CALLMAP *)NULL,(int)0,(JCHAR *)NULL,
                                         (JCHAR *)NULL,(int)0);

            if ((idReturnCode == ER_SUCCESS)&&
                (IsStringBlank(dsD4000880.szErrorMessage)) && /* Mobile Sales */
                (MathCompare(&dsD4000880.mnSynchronizationStatus, &mnTwo) <= 0)) /* Mobile Sales */
            {
               jdeStrcpy((JCHAR *)lpds4200310->szShipToBranchPlant, 
                         (const JCHAR *)dsD4000880.szBranchPlant);
            }
         }

        /* SAR 4625500 - change to Call MBFCustomerMaster to retrieve si01     */ 
         MathCopy(&dsD4200140.mnShipToAddress,&lpDS->mnShipToNo);
         
        /* LOB */
         jdeStrcpy((JCHAR *)dsD4200140.szCompany, (const JCHAR *)lpDS->szOrderCo);

         idReturnCode = jdeCallObject(_J("GetShipToBillingInstructions"), (LPFNBHVR) NULL, lpBhvrCom, 
                                      lpVoid, (LPVOID) &dsD4200140,  (CALLMAP *) NULL, 0, 
                                      (JCHAR *) _J('\0'), (JCHAR *) _J('\0'), 0);

        /* SAR 8931909 - Customer Set Tax Rate Area should populate from SHIP TO when address for tax is 1 */
         if (lpds4200310->cUseCustomerSet == _J('1'))
         {
            if (lpDS->cWKSourceOfData == _J('4') && IsJDEDATENull(&lpDS->jdOrderDate))
            {
               memcpy((void *)(&lpDS->jdOrderDate), (const void *)(&lpDS->jdDateUpdated), sizeof(JDEDATE));
            }

            I4200310_DateSensitiveCustSets(lpBhvrCom, lpVoid, hUser, lpDS, NULL, &lpDS->jdOrderDate,
                                           lpds4200310->cUseCustomerSet);

           /* SAR 8932897 - Check for Blank to retain Manual overridden value */
            if (lpDS->cAddressNumberForTax == _J('1') && (IsStringBlank(lpDS->szTaxArea)))
            {
               jdeStrcpy((JCHAR *)(lpDS->szTaxArea),(const JCHAR *)(dsD4200140.szTaxArea));

			   /* Bug 32081380 - Tax explanation code should always be retrieved from sold to */
			   /*Begin Bug 21401361*/
			   if (IsStringBlank(lpDS->szTaxExplanationCode))
			   {
				   jdeStrcpy((JCHAR *)(lpDS->szTaxExplanationCode), (const JCHAR *)(dsD4200100.szTaxExplainationCode));
			   }
			   /*End Bug 21401361*/
            }
         }
        /* SAR 8931909 - Ends */
         
         if ((idReturnCode != ER_SUCCESS) ||
             ((dsD4200140.cBillingaddresstype !=_J('S')) &&
              (dsD4200140.cBillingaddresstype !=_J('X'))))
         {
            idErrorFlag   = 3;
            jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("1020"));
         }
         else if (MathCompare(&dsD4200140.mnSynchronizationStatus, &mnTwo) > 0)  /* Mobile Sales */
         {
            idErrorFlag   = 3;
            jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("4210Z"));
         }
      }
      else
      {
         idErrorFlag   = 3;
         jdeSetGBRError  (lpBhvrCom, lpVoid,(ID)IDERRszLongAddressNumberShipto_102, _J("0037"));
      }
   }
  /*----------------------------------------------------------------- 
   * If sold to address was not passed, find that out using the
   * ship to Related Add.# and call GetSoldToBillingInstructions 
   *----------------------------------------------------------------*/
   else
   {
      if ((nAddressNoFlag == 2 )&& (idErrorFlag < 3 ))
      {
         cReturnValue = I4200310_GetAddressNo(lpBhvrCom, lpVoid, lpds4200310, &dsD4000880,
                                              &dsD4200140.mnRelatedAddressNum,
                                              dsD4200140.cBillingaddresstype,
                                              &lpDS->mnAddressNumber);

         if (cReturnValue != _J('3'))
         {
           /* SAR 8931909 - Customer Set Tax Rate Area should populate from SHIP TO when address for tax is 1 */
            if (lpds4200310->cUseCustomerSet == _J('1'))
            {
               if (lpDS->cWKSourceOfData == _J('4') && IsJDEDATENull(&lpDS->jdOrderDate))
               {
                  memcpy((void *)(&lpDS->jdOrderDate) ,(const void *)(&lpDS->jdDateUpdated), sizeof(JDEDATE));
               }

               I4200310_DateSensitiveCustSets(lpBhvrCom, lpVoid, hUser, lpDS, NULL, &lpDS->jdOrderDate,
                                              lpds4200310->cUseCustomerSet);
            
               if ((lpDS->cAddressNumberForTax == _J('1')) && (IsStringBlank(lpDS->szTaxArea)))
               {
                  jdeStrcpy((JCHAR *)(lpDS->szTaxArea),(const JCHAR *)(dsD4200140.szTaxArea));
               }
            }
           /*-----------------------------------------------------------
            * If the header branch is blank, get the header branch from
            * the Address Book for Sold To
            *----------------------------------------------------------*/
            if ((IsStringBlank(lpDS->szBusinessUnit)))
            {
               memset((void *)(&dsD4000880),(int)(_J('\0')),sizeof(dsD4000880));

               MathCopy(&dsD4000880.mnAddressNumber,&lpDS->mnAddressNumber);

               idReturnCode = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                            NULL,lpBhvrCom,lpVoid,(LPVOID)&dsD4000880,
                                            (CALLMAP *)NULL,(int)0,(JCHAR *)NULL,
                                            (JCHAR *)NULL,(int)0);

               if ((idReturnCode == ER_SUCCESS)&&
                   (IsStringBlank(dsD4000880.szErrorMessage)) && /* Mobile Sales */
                   (MathCompare(&dsD4000880.mnSynchronizationStatus, &mnTwo) <= 0)) /* Mobile Sales */
               {
                  jdeStrcpy((JCHAR *)lpds4200310->szSoldToBranchPlant, 
                            (const JCHAR *)dsD4000880.szBranchPlant);

                 /* SAR 6348471 */
                  jdeStrcpy((JCHAR *)(szSoldToCertificate),
                            (const JCHAR *)(dsD4000880.szTaxCertificate));

                 /* SAR 8125975 - Copy the language Pref of Sold to if Sold to is defaulted from Ship to */
                  jdeStrcpy((JCHAR *)lpds4200310->szLanguagePreference,               
                            (const JCHAR *)dsD4000880.szLanguagePreference);
               }
            }
            else
            {
              /*********************************************************************
               * Begin SAR 7898491 - Get Credit Message for soldTo address
               **********************************************************************/
               memset((void *)(&dsD4000880), (int)(_J('\0')), sizeof(dsD4000880));
               MathCopy(&dsD4000880.mnAddressNumber, &lpDS->mnAddressNumber);

               idReturnCode = jdeCallObject(_J("VerifyAndGetF0101ForOP"),
                                            NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4000880,
                                            (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                            (JCHAR *)NULL, (int)0);

              /* End SAR 7898491 */
              /* SAR 8125975 - Copy the language Pref of Sold to if Sold to is defaulted from Ship to */
               if (idReturnCode == ER_SUCCESS)
               {
                  jdeStrcpy((JCHAR *)lpds4200310->szLanguagePreference,
                            (const JCHAR *)dsD4000880.szLanguagePreference);
				  /*Bug 28127964 ? If sold to is defaulted from ship to Copy the Tax certificate of Sold to */
				  jdeStrcpy((JCHAR *)(szSoldToCertificate),
					        (const JCHAR *)(dsD4000880.szTaxCertificate));
               }
            }
            
            MathCopy(&dsD4200100.mnSoldToAddress, &lpDS->mnAddressNumber);

           /* LOB */
            jdeStrcpy((JCHAR *)dsD4200100.szCompany, 
                      (const JCHAR *)lpDS->szOrderCo);

           /* SAR 5146519 */
            if (((lpds4200310->cPODefaultShipToBranch == _J('1')) ||
                 (lpds4200310->cPODefaultShipToBranch == _J('2'))) &&    
                (IsStringBlank(dsD4200100.szCompany)))
            {
               idReturnCode= I4200310_CallRetrieveCoFromMCU(lpBhvrCom, lpVoid, 
                                                            dsD4000880.szBranchPlant, 
                                                            dsD4200100.szCompany);
            }

           /* SAR 8252991 - Begins */
            if ((jdeStrcmp(dsD4200100.szCompany,dsD4200140.szCompany) != 0) &&
                (lpds4200310->cPODefaultShipToBranch == _J('2')))
            { 
               jdeStrcpy((JCHAR *)dsD4200140.szCompany, (const JCHAR *)dsD4200100.szCompany);

               idReturnCode = jdeCallObject(_J("GetShipToBillingInstructions"), (LPFNBHVR) NULL, 
                                            lpBhvrCom, lpVoid, (LPVOID) &dsD4200140, 
                                            (CALLMAP *) NULL, 0, (JCHAR *) _J('\0'), 
                                            (JCHAR *) _J('\0'), 0);

               if ((idReturnCode != ER_SUCCESS) ||
                   ((dsD4200140.cBillingaddresstype !=_J('S')) && 
                    (dsD4200140.cBillingaddresstype !=_J('X'))))
               {
                  idErrorFlag   = 3;
                  jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("1020"));
               }
               else if (MathCompare(&dsD4200140.mnSynchronizationStatus, &mnTwo) > 0)  
               { 
                  idErrorFlag   = 3; 
                  jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("4210Z"));
               }
            }
           /* SAR 8252991 - Ends */
            
            idReturnCode = jdeCallObject(_J("GetSoldToBillingInstructions"),
                                         NULL, lpBhvrCom, lpVoid, (LPVOID)&dsD4200100,
                                         (CALLMAP *)NULL, (int)0, (JCHAR *)NULL,
                                         (JCHAR *)NULL, (int)0);

            if ((idReturnCode != ER_SUCCESS) ||
                ((dsD4200100.cBillingAddressNumber !=_J('B'))&&
                 (dsD4200100.cBillingAddressNumber !=_J('X'))))
            {
               idErrorFlag   = 3;
               jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumber_103, _J("1020"));
            }
            else if (MathCompare(&dsD4200100.mnSynchronizationStatus, &mnTwo) > 0)  /* Mobile Sales */
            {
               idErrorFlag   = 3;
               jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumber_103, _J("4210Z"));
            }
            else
            {
              /* SAR 2323250 */
               jdeStrcpy((JCHAR *)lpds4200310->szSoldToBranchPlant,
                         (const JCHAR *)dsD4000880.szBranchPlant);
			   /*
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  Begin DWS  P273T001CRA     Zayne Julius      5-Mar-2015
  Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  */
			   if (cSoldToOrShipToDefault == _J('1'))
			   {
				   /*
				   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
				   End DWS  P273T001CRA     Zayne Julius      5-Mar-2015
				   Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
				   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
				   */

				   /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ START
					* Ibstock Bricks modification P227T003EUB - Upgrade - Bundle 1 - Task 3
					* David Macek		14.06.2013			Replace D0100042 with D4200140		*/
					/* DWS.262.006.DD    Lee Balsom
					 * At this point in the code, the Sold To Addr wasn't past, but has been
					 * determined from the related Ship To Addr. (above).
					 * Now call the Customer MBF to retrieve the Sold To's tax details
					 */

				   MathCopy(&dsD4200140SoldTo.mnShipToAddress, &lpDS->mnAddressNumber);

				   /* LOB */
				   jdeStrncpyTerminate((JCHAR *)dsD4200140SoldTo.szCompany,
					   (const JCHAR *)lpDS->szOrderCo, DIM(dsD4200140SoldTo.szCompany));

				   /* dsD0100042SoldTo.cActionCode = _J('I');	* This parameter does not exist in the new function */
				   idDWSReturnCode = jdeCallObject(/*_J("MBFCustomerMaster")*/ _J("GetShipToBillingInstructions"), NULL, lpBhvrCom,
					   lpVoid, (LPVOID)&dsD4200140SoldTo,
					   (CALLMAP *)NULL, 0, (JCHAR *)NULL,
					   (JCHAR *)NULL, 0);

				   if ((idDWSReturnCode != ER_SUCCESS) /*(!IsStringBlank(dsD4200140SoldTo.szErrorMessageID))*/ ||
					   ((dsD4200140SoldTo.cBillingaddresstype != _J('B')) &&
					   (dsD4200140SoldTo.cBillingaddresstype != _J('X'))))
				   {
					   idErrorFlag = 3;
					   jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumber_103, _J("1020"));
				   }
				   /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ END					*/

					  /*
					  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
					  Begin DWS  P273T001CRA     Zayne Julius      5-Mar-2015
					  Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
					  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
					  */
			   }


			   /*
			   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
			   End DWS  P273T001CRA     Zayne Julius      5-Mar-2015
			   Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
			   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
			   */
            }
         }

         if (IsStringBlank(lpDS->szWKCreditMesg))   /* SAR 8054783 */
         {
            jdeStrcpy((JCHAR *)(lpDS->szWKCreditMesg),(const JCHAR *)(dsD4000880.szCreditMessage));
         }  
         else
         {
            idErrorFlag   = 3;
            jdeSetGBRError(lpBhvrCom, lpVoid,(ID)IDERRszLongAddressNumber_103, _J("0037"));
         }
      }
   }

   lpds4200310->cCustomerPORequiredYN = dsD4200100.cCustomerPORequireDate;

  /* SAR 8374058 - Consolidated the IF condition
   * Combined the logic to check whether AN8, SHAN, DVAN or AUFI is changed 
   */
   if (lpDS->cCMDocAction ==_J('C')  &&                      
       ((MathZeroTest(&lpDS->mnAddressNumber) && 
         MathZeroTest(&lpds4200310->lpdsF42UI01->zhan8)&&
         (MathCompare(&lpDS->mnAddressNumber, &lpds4200310->lpdsF42UI01->zhan8) != 0)) ||
         (MathZeroTest(&lpDS->mnShipToNo) && 
          MathZeroTest(&lpds4200310->lpdsF42UI01->zhshan)&&
          (MathCompare(&lpDS->mnShipToNo, &lpds4200310->lpdsF42UI01->zhshan) != 0)) ||
         (MathCompare(&lpDS->mnAddressNumberDeliveredTo, &lpds4200310->lpdsF42UI01->zhdvan) != 0) ||
         (lpDS->cAddressNumberForTransport != lpds4200310->lpdsF42UI01->zhaufi)))
   {
      bAddressChanged = TRUE;
   }

  /* SAR 8955602 - Add this function call 
   */ 
   
   idErrorFlag += I4200310_GetUseTaxedPricesFlagForOrder(hUser, lpBhvrCom, lpVoid,
                                                      lpDS, lpDS4200310L);


  /*----------------------------------------------------------------- 
   * At this point we have both SoldTo and ShipTo Address No.s and 
   * all the billing instructions for defaulting. So, copy all those 
   * into the Business function datastructure 
   * SAR 3039040 - Begin/End CHANGE
   * S&F orders entered with Partial Edit mode will have blank 
   * Backorders Allowed and Partial Ship flags. On a Full Edit
   * mode, these flags must be retrieved.
   *----------------------------------------------------------------*/
  /* SAR 8374058 - Checked whether bAddressChanged is TRUE */
   if ((idErrorFlag < 3 && lpDS->cCMDocAction ==_J('A')) ||
       (idErrorFlag < 3 && lpds4200310->nEditLevel < 2  && 
        (lpds4200310->cBackordersAllowedYN == _J(' ') || lpds4200310->cBackordersAllowedYN == _J('\0'))) ||
       (bAddressChanged == TRUE))
   {
      if (lpds4200310->nEditLevel < 2)
      {
        /*-----------------------------------------------------------
         * Default from Sold To Master ABTXCT - GetF0101ForOP 
         *----------------------------------------------------------*/
        /* SAR 6632703 */
         if (IsStringBlank(lpDS->szCertificate))
         {
            jdeStrcpy((JCHAR *)(lpDS->szCertificate),
                      (const JCHAR *)(szSoldToCertificate)); 
         }
		/* Bug 13373797 - Populate Tax Explanation code from Sold To */
		 if(IsStringBlank(lpDS->szTaxExplanationCode))
		 {
			 jdeStrcpy((JCHAR *)(lpDS->szTaxExplanationCode),(const JCHAR *)(dsD4200100.szTaxExplainationCode));
		 }

      } /* end of if for nEditLevel < 2 */

     /*  SAR 8054783 Delete copy credit message statment,it always fetch from Sold to address */
	   /*
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   Begin DWS  P273T001CRA     Zayne Julius      5-Mar-2015
   Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   */
	  if (cSoldToOrShipToDefault == _J('1'))
	  {
		  /*
		  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
		  End DWS  P273T001CRA     Zayne Julius      5-Mar-2015
		  Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
		  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
		  */

		  /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ START
		   * Ibstock Bricks modification P227T003EUB - Upgrade - Bundle 1 - Task 3
		   * David Macek		14.06.2013					*/
		   /* WS.262.006.DD    Lee Balsom
			* Before calling the "Get Defaults" subroutines (which perform the defaulting
			* of the Tax Code and Explanation), override these 2 tax fields in Ship To's
			* structure with the contents of the Sold To's structure.      */
			/* Use dsD4200140 instead of dsD0100042 */
		  jdeStrncpyTerminate((JCHAR *)(dsD4200140.szTaxArea), (const JCHAR *)(dsD4200140SoldTo.szTaxArea), DIM(dsD4200140.szTaxArea));
		  jdeStrncpyTerminate((JCHAR *)(dsD4200140.szTaxExplainationCode), (const JCHAR *)(dsD4200140SoldTo.szTaxExplainationCode), DIM(dsD4200140.szTaxExplainationCode));
		  /*@@@@@@@@@@@@@@@@@@@@@@@@@@@ END					*/

			 /*
			 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
			 Begin DWS  P273T001CRA     Zayne Julius      5-Mar-2015
			 Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
			 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
			 */
	  }

	  /*
	  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
	  End DWS  P273T001CRA     Zayne Julius      5-Mar-2015
	  Glen Gery - Use UDC 56/TM to switch the use of Sold to versus Ship To for Tax
	  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
	  */

     /* SAR 8395941 -  Populate teh PLST value from the SoldToBillingInstructions,
      * incase the Soldto value is BLANK */
      if (nAddressNoFlag == 2)
      {
         lpDS->cPricePickListYN = dsD4200100.cPricePickList;
      }

     /* BUG 11048976 - When Address changed then SoldTo Billing instructions should get defaulted */
      idErrorFlag += I42000310_GetDfltsForSoldToBlngInstrns(lpBhvrCom, lpVoid,
                                                            lpDS, &dsD4200100,
                                                            lpds4200310);

     /* SAR 8374058 - When Customer Set is ON, customer set values are retrieved from P42430.
      * If cAddressNumberForTransport is 2, then the billing info is fetched for DVAN and not SHAN */
      if (lpds4200310->cUseCustomerSet == _J('1'))
      {
        /* SAR 8931909 - Deleted code as it is used already */
         if (lpDS->cAddressNumberForTransport == _J('2') && !MathZeroTest(&lpDS->mnAddressNumberDeliveredTo))
         {
            if (lpDS->cCMDocAction == _J('A'))
            {
               MathCopy(&lpDS->mnAddressNumberDeliveredTo, &lpDS->mnShipToNo);
            }
            else if (lpDS->cCMDocAction == _J('C'))
            {
               if (MathZeroTest(&lpds4200310->lpdsF42UI01->zhdvan))
               {
                  MathCopy(&lpDS->mnAddressNumberDeliveredTo, &lpds4200310->lpdsF42UI01->zhdvan);
               }
               else
               {
                  MathCopy(&lpDS->mnAddressNumberDeliveredTo, &lpDS->mnShipToNo);
               }
            }
         }

         if (lpDS->cAddressNumberForTransport == _J('2') && MathZeroTest(&lpDS->mnAddressNumberDeliveredTo))
         {
            memset((void *)(&dsD4200140),(int)(_J('\0')),sizeof(dsD4200140));
            MathCopy(&dsD4200140.mnShipToAddress,&lpDS->mnAddressNumberDeliveredTo);
            jdeStrcpy((JCHAR *)dsD4200140.szCompany, (const JCHAR *)lpDS->szOrderCo);

            idReturnCode = jdeCallObject(_J("GetShipToBillingInstructions"), (LPFNBHVR) NULL, lpBhvrCom, 
                                         lpVoid, (LPVOID) &dsD4200140, 
                                         (CALLMAP *) NULL, 0, (JCHAR *) _J('\0'), 
                                         (JCHAR *) _J('\0'), 0);

            if ((idReturnCode != ER_SUCCESS) ||
                ((dsD4200140.cBillingaddresstype !=_J('S')) &&
                 (dsD4200140.cBillingaddresstype !=_J('X'))))
            {
               idErrorFlag   = 3;
               jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("1020"));
            }
            else if (MathCompare(&dsD4200140.mnSynchronizationStatus, &mnTwo) > 0)  
            {
               idErrorFlag   = 3; 
               jdeSetGBRError(lpBhvrCom, lpVoid, (ID)IDERRszLongAddressNumberShipto_102, _J("4210Z"));
            }
         }
      }

     /* SAR 8374058 - Ends */
      idErrorFlag += I42000310_GetDfltsForShipToBlngInstrns(lpBhvrCom, lpVoid,
                                                            lpDS, &dsD4200140,
                                                            lpds4200310);

     /* CRM inactive customer support */
      idErrorFlag += I4200310_RetrieveAndValidateInactiveCustInfo(lpBhvrCom,
                                                                  lpVoid,
                                                                  &dsD4200100,
                                                                  &dsD4200140,
                                                                  lpds4200310M);
   }

   if (!MathZeroTest(&lpds4200310->mnMaxOrderAmnt))
   {
      MathCopy(&lpds4200310->mnMaxOrderAmnt,&dsD4200100.mnMaximumOrder);
   }

   if (!MathZeroTest(&lpds4200310->mnMinOrderAmnt))
   {
      MathCopy(&lpds4200310->mnMinOrderAmnt,&dsD4200100.mnMinimumOrder);
   }

   /* SAR 8446998 - Get the Partial Shipment Allowed Flag in Update mode */

   if (lpds4200310->cOrderPartialShipAllowed == _J(' ')   ||
       lpds4200310->cOrderPartialShipAllowed == _J('\0'))
   {
      lpds4200310->cOrderPartialShipAllowed = dsD4200140.cPartialOrderShipmentsAllowed;
   }

   jdeStrcpy((JCHAR *) lpds4200310->szCompany , (const JCHAR *) dsD4200100.szCustomerMasterCompany);
	/* Bug# 12684904 */
	jdeStrcpy((JCHAR *)(lpds4200310->szOFWCompany), (const JCHAR *)(&dsD4200100.szCustomerMasterCompany));	

	/* Reconcile the Default ContactLine */
	I4200310_RetrieveSoldShipContactLineID(lpBhvrCom, lpVoid, lpDS, lpds4200310);
	/* Bug 21233386 - Retrieve sold to and ship to attention for P42101 */
	if ((jdeStrcmp((JCHAR *)lpDS->szCMProgramID, (JCHAR *) _J("EP42101")) == 0))
	{
		if (IsStringBlank(lpDS->szShipToAttention))
		{
			jdeStrcpy((JCHAR *)(lpDS->szShipToAttention), (const JCHAR *)(lpDS->szShipToContactAlphaName));
		}
		if (IsStringBlank(lpDS->szSoldToAttention))
		{
			jdeStrcpy((JCHAR *)(lpDS->szSoldToAttention), (const JCHAR *)(lpDS->szSoldToContactAlphaName));
		}
	}

  /* SAR 8707537 */
   if ((lpds4200310->cSendMethod == _J(' ')) ||
       (lpds4200310->cSendMethod == _J('\0')))
   {
      MathCopy(&dsGetF03012Internal.mnCustomerNumber, &lpDS->mnAddressNumber);
      jdeStrcpy((JCHAR *)&dsGetF03012Internal.szCustomerCompany,
                (const JCHAR *)&lpDS->szOrderCo);
     
      idReturnValue = I4200310_GetCustomerBillingInstrns(lpBhvrCom, lpVoid, 
                                                         hUser, &dsGetF03012Internal);
      if (idReturnValue == ER_SUCCESS)
      {
         lpds4200310->cSendMethod = dsGetF03012Internal.cCorrespondenceMethod;
      }
   }
  
   return idErrorFlag;
} /* end of  I4200310_ValidateAndGetDefaults1 */