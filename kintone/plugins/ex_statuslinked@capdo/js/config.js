/*
*--------------------------------------------------------------------
* jQuery-Plugin "statuslinked -config.js-"
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
		fieldtable:[],
		statustable:null
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		$.each(resp.properties,function(key,values){
			/* check field type */
			switch (values.type)
			{
				case 'DATE':
				case 'MULTI_LINE_TEXT':
				case 'SINGLE_LINE_TEXT':
					$('select#field').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
		});
		kintone.api(kintone.api.url('/k/v1/app/status',true),'GET',{app:kintone.app.getId()},function(resp){
			var add=false;
			var row=null;
			var fields=[];
			var statuses=(Object.keys(config).length!==0)?JSON.parse(config['status']):{};
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
			vars.statustable=$('.statuses').adjustabletable();
			for (var i=0;i<statuskeys.length;i++)
			{
				if (i!=0) vars.statustable.addrow();
				row=vars.statustable.rows.last();
				$('span.statusname',row).text(statuskeys[i]);
				$('input#status',row).val(statuskeys[i]);
				vars.fieldtable.push(
					$('.fields',row).adjustabletable({
						add:'img.add',
						del:'img.del'
					})
				);
				if (statuskeys[i] in statuses)
				{
					add=false;
					fields=statuses[statuskeys[i]].split(',');
					for (var i2=0;i2<fields.length;i2++)
					{
						if (add) vars.fieldtable[i].addrow();
						else add=true;
						row=vars.fieldtable[i].rows.last();
						$('select#field',row).val(fields[i2]);
					}
				}
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
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
				if ($('select#field',row).val()!='') fields.push($('select#field',row).val());
			}
			statuses[vars.statustable.rows.eq(i).find('input#status').val()]=fields.join(',');
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