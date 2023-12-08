import { LightningElement, track, wire,api } from 'lwc';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getFieldTypesWithOptions from '@salesforce/apex/GenericRelatedListController.getFieldTypesWithOptions';
import getRelatedListRecords from '@salesforce/apex/GenericRelatedListController.getRelatedListRecords';



 
const columns = [
    { label: 'Name', fieldName: 'Name', editable: true },
    { label: 'Phone', fieldName: 'Phone', type: 'phone', editable: true },
    {
        label: 'Type', fieldName: 'Type', type: 'picklistColumn', editable: true, typeAttributes: {
            placeholder: 'Choose Type', options: { fieldName: 'pickListOptionsType' }, 
            value: { fieldName: 'Type' }, // default value for picklist,
            context: { fieldName: 'Id' } // binding account Id with context variable to be returned back
        }
    },{
        label: 'CleanStatus', fieldName: 'CleanStatus', type: 'picklistColumn', editable: true, typeAttributes: {
            placeholder: 'Choose Type', options: { fieldName: 'pickListOptionsCleanStatus' }, 
            value: { fieldName: 'CleanStatus' }, // default value for picklist,
            context: { fieldName: 'Id' } // binding account Id with context variable to be returned back
        }
    }
]
 
export default class CustomDatatableDemo extends LightningElement {
   @track columns = [];
    //columns = columns;
    showSpinner = false;
    @track data = [];
    
    @track accountData;
    @track draftValues = [];
    lastSavedData = [];
    @track pickListOptions = [];
    //@api childObjectApiName = 'Account';
    @track pickListOptions2 = [];

    @api listName; // Parent record Id
    @api recordId; // Parent record Id
    @api icon;
    @api relationshipField; // Relationship field API name
    @api childObjectApiName; // Child object API name
    @api displayFields; // Comma-separated API names of fields to display\
    @api filterData = null;
    @track  displayFieldsArr = []; // Comma-separated API names of fields to display
    @api clickableField; // Clickable field API name
    @track fieldMetadata = [];
    @track listSize;

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    objectInfo;

    @wire(getFieldTypesWithOptions, { objectApiName: '$childObjectApiName', fields: '$displayFields' })
    wiredFields({ error, data }) {
        if (data) {
            console.log('fieldata');
            console.log(data);

            this.fieldMetadata = data;

            var newColumns = [];
for (let field of this.fieldMetadata.fields) {
    let column = {
        label: field.fieldLabel,
        fieldName: field.fieldName,
        editable: field.fieldEditable
    };
    if (field.fieldType === 'PICKLIST') {
            console.log(field.fieldOptions);
            this.pickListOptions[field.fieldName] = field.fieldOptions.map(option => ({
    label: option,
    value: option
}));



        column.type = 'picklistColumn';
        column.typeAttributes = {
            placeholder: 'Choose ' + field.fieldName,
            options: { fieldName: 'pickListOptions'+field.fieldName },
            value: { fieldName: field.fieldName },
            context: { fieldName: 'Id' }
        };
    } else if (field.fieldType === 'DATETIME') {
        column.type = 'date';
    } else if(field.fieldName == this.clickableField){
        column.fieldName = 'itemURL';
        column.type = 'url';
        column.editable = false;
        column.typeAttributes = {
            label:{
                fieldName : field.fieldName
            }
        }
        

    }else if(field.fieldType === 'PHONE'){
        column.cellAttributes = {
          iconName: 'utility:phone_portrait' 

        }
        }
    else{
        column.type = field.fieldType.toLowerCase();
    }
    newColumns.push(column);
    this.columns = newColumns;
    
} 
            console.log('97 this.columns');

console.log(this.columns);

        } else if (error) {
            console.error('Error retrieving picklist values:', error);
        }
    }

    
    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relationshipField: '$relationshipField',
        childObjectApiName: '$childObjectApiName',
        fieldsToDisplay: '$displayFields',  
        filter: '$filterData'
    })
    accountData(result) {
        this.accountData = result;
        if (result.data) {
            console.log(result.data);
            this.data = JSON.parse(JSON.stringify(result.data));
            console.log('fetchdata');
            console.log(this.data);
            this.listSize = this.data.length;

            let displayFieldsArr = this.displayFields.split(',');
            console.log(displayFieldsArr);
            this.data.forEach(ele => {
                ele['itemURL'] = '/' +ele.Id;

                displayFieldsArr.forEach(field => {
                    let varname = 'pickListOptions' + field;
                    if(this.pickListOptions[field] != ''){
                ele[varname] = this.pickListOptions[field];

                    }

                })


            })
 
            this.lastSavedData = JSON.parse(JSON.stringify(this.data));
            console.log('168 data');
            console.log(this.data);
        } else if (result.error) {
                        this.showToast('Query Error', result.error.message, 'error', 'dismissable');
            this.data = undefined;
        }
    }; 


    

 
    updateDataValues(updateItem) {
        let copyData = JSON.parse(JSON.stringify(this.data));
 
        copyData.forEach(item => {

            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
            }
        });
 
        //write changes back to original data
        this.data = [...copyData];
    }
 
    updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = [...this.draftValues];
        //store changed value to do operations
        //on save. This will enable inline editing &
        //show standard cancel & save button
        copyDraftValues.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });
 
        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
    }
 
    //handler to handle cell changes & update values in draft values
    handleCellChange(event) {
        //this.updateDraftValues(event.detail.draftValues[0]);
        let draftValues = event.detail.draftValues;
        draftValues.forEach(ele=>{
            this.updateDraftValues(ele);
        })
    }
 
    handleSave(event) {
        this.showSpinner = true;
        this.saveDraftValues = this.draftValues;
 
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
 
        // Updateing the records using the UiRecordAPi
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.showToast('Success', 'Records Updated Successfully!', 'success', 'dismissable');
            this.draftValues = [];
            return this.refresh();
        }).catch(error => {
            console.log(error);
            this.showToast('Error', error.body.message, 'error', 'dismissable');
        }).finally(() => {
            this.draftValues = [];
            this.showSpinner = false;
        });
    }
 
    handleCancel(event) {
        //remove draftValues & revert data changes
        this.data = JSON.parse(JSON.stringify(this.lastSavedData));
        this.draftValues = [];
    }
 
    showToast(title, message, variant, mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }
 
    // This function is used to refresh the table once data updated
    async refresh() {
        await refreshApex(this.accountData);
    }
}