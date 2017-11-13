/*
*--------------------------------------------------------------------
* jQuery-Plugin "processlinked -config.js-"
* Version: 3.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		statustable:null,
		fieldtable:[]
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		var mappings=[];
		/* append lookup mappings fields */
		$.each(resp.properties,function(key,values){
			if (values.lookup)
				$.each(values.lookup.fieldMappings,function(index,values){
					mappings.push(values.field);
				});
		});
		$.each(resp.properties,function(key,values){
			/* check field type */
			switch (values.type)
			{
				case 'CALC':
				case 'CATEGORY':
				case 'CREATED_TIME':
				case 'CREATOR':
				case 'GROUP':
				case 'MODIFIER':
				case 'RECORD_NUMBER':
				case 'REFERENCE_TABLE':
				case 'RICH_TEXT':
				case 'STATUS':
				case 'STATUS_ASSIGNEE':
				case 'SUBTABLE':
				case 'UPDATED_TIME':
					break;
				default:
					if ($.inArray(values.code,mappings)<0) $('select#field').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
		});
		kintone.api(kintone.api.url('/k/v1/app/status',true),'GET',{app:kintone.app.getId()},function(resp){
			var add=false;
			var row=null;
			var statuses=(Object.keys(config).length!==0)?JSON.parse(config['status']):{};
			var statusfields=[];
			var statuskeys=[];
			var statussort=[];
			$.each(resp.states,function(key,values){
				if (values.index!='0') statussort.push(values);
			});
			statussort.sort(function(a,b){
				if(parseInt(a.index)<parseInt(b.index)) return -1;
				if(parseInt(a.index)>parseInt(b.index)) return 1;
				return 0;
			});
			for (var i=0;i<statussort.length;i++) statuskeys.push(statussort[i].name);
			vars.statustable=$('.statuses').adjustabletable({
				addcallback:function(row){
					vars.fieldtable.push(
						$('.fields',row).adjustabletable({
							add:'img.add',
							del:'img.del'
						})
					);
				}
			});
			for (var i=0;i<statuskeys.length;i++)
			{
				if (i!=0) vars.statustable.addrow();
				row=vars.statustable.rows.last();
				$('span.statusname',row).text(statuskeys[i]);
				$('input#status',row).val(statuskeys[i]);
				if (statuskeys[i] in statuses)
				{
					statusfields=statuses[statuskeys[i]].split(',');
					add=false;
					for (var i2=0;i2<statusfields.length;i2++)
					{
						if (add) vars.fieldtable[i].addrow();
						else add=true;
						$('select#field',vars.fieldtable[i].rows.last()).val(statusfields[i2]);
					}
				}
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var fields=[];
		var statuses={};
		/* check values */
		for (var i=0;i<vars.statustable.rows.length;i++)
		{
			fields=[];
			for (var i2=0;i2<vars.fieldtable[i].rows.length;i2++)
			{
				row=vars.fieldtable[i].rows.eq(i2);
				if ($('select#field',row).val().length==0) continue;
				fields.push($('select#field',row).val());
			}
			statuses[$('input#status',vars.statustable.rows.eq(i)).val()]=fields.join(',');
		}
		/* setup config */
		config['status']=JSON.stringify(statuses);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);