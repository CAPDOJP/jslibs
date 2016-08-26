/*
*--------------------------------------------------------------------
* jQuery-Plugin "grideditor"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		loaded:false,
		container:null,
		header:null,
		rows:null,
		template:null,
		fieldinfo:[],
		disabled:{
			'RICH_TEXT':'リッチエディター',
			'FILE':'添付ファイル',
			'USER_SELECT':'ユーザー選択',
			'SUBTABLE':'テーブル',
			'ORGANIZATION_SELECT':'組織選択フィールド',
			'GROUP_SELECT':'グループ選択フィールド'
		},
		exclude:[
			'LABEL',
			'CALC',
			'RICH_TEXT',
			'FILE',
			'SPACER',
			'HR',
			'USER_SELECT',
			'REFERENCE_TABLE',
			'RECORD_NUMBER',
			'CREATOR',
			'CREATED_TIME',
			'MODIFIER',
			'UPDATED_TIME',
			'SUBTABLE',
			'ORGANIZATION_SELECT',
			'GROUP_SELECT'
		]
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	var functions={
		/* get field value */
		fieldvalue:function(element,fieldinfo){
			var fieldvalue=(element.val()==null)?'':element.val().toString();
			if (fieldvalue.length==0)
			{
				/* check required */
				if (fieldinfo.required)
				{
					/* check default value */
					if (fieldinfo.defaultValue!=null) fieldvalue=fieldinfo.defaultValue;
				}
			}
			return fieldvalue;
		}
	};
	/*---------------------------------------------------------------
	 key events
	---------------------------------------------------------------*/
	$(document).on('keydown','button,input[type=text],select',function(e){
		var code=e.keyCode||e.which;
		if (code==13)
		{
			var targets=$(this).closest('table').find('button:visible,input[type=text]:visible,select:visible,textarea:visible');
			var total=targets.length;
			var index=targets.index(this);
			if (e.shiftKey)
			{
				if (index==0) index=total;
				index--;
			}
			else
			{
				index++;
				if (index==total) index=0;
			}
			targets.eq(index).focus();
			return false;
		}
	});
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!config) return false;
		/* check viewid */
		if (event.viewId!=config.viewId) return;
		/* initialize valiable */
		vars.container=$('div#grideditor-container');
	   	vars.header=$('<thead>');
	   	vars.rows=$('<tbody>');
	   	vars.template=$('<tr>').append($('<td>').append($('<label>')));
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:kintone.app.getId()},function(resp){
			var fields=['$id'];
			var row=$('<tr>').append($('<th>').text('No'));
			/* create header and template */
			$.each(resp.properties,function(index,values){
				var fieldinfo=values;
				/* check disabled type */
				if (fieldinfo.type in vars.disabled)
				{
					var message='';
					message+='以下のフィールドが配置されている場合は使用出来ません。\r\n';
					message+='\r\n';
					$.each(vars.disabled,function(key,value){
						message+=value+'\r\n';
					});
					return;
				}
				/* check exclude type */
				if ($.inArray(fieldinfo.type,vars.exclude)<0)
				{
					/* create header field */
					row.append($('<th>').text(fieldinfo.label));
					/* create template field */
					var element=null;
					switch (fieldinfo.type)
					{
						case 'SINGLE_LINE_TEXT':
						case 'DATE':
						case 'TIME':
						case 'DATETIME':
						case 'LINK':
							element=$('<input type="text">');
							break;
						case 'NUMBER':
							element=$('<input type="text" class="right">');
							break;
						case 'MULTI_LINE_TEXT':
							element=$('<textarea>');
							break;
						case 'CHECK_BOX':
						case 'MULTI_SELECT':
							element=$('<select multiple="multiple">');
							$.each(fieldinfo.options,function(index,value){
								element.append($('<option>').attr('value',value).text(value));
							});
						case 'RADIO_BUTTON':
						case 'DROP_DOWN':
							element=$('<select>');
							$.each(fieldinfo.options,function(index,value){
								element.append($('<option>').attr('value',value).text(value));
							});
							break;
					}
					vars.template.append($('<td>').append(element.onvaluechanged(function(target){
						if (vars.loaded)
						{
							var row=$(this).closest('tr');
							var index=row.find('td').eq(0).find('label').text();
							var method='';
							var body={};
							var record={};
							if (index.length!=0)
							{
								/* update */
								method='PUT';
								body={
									app:kintone.app.getId(),
									id:index,
									record:{}
								};
								record[fieldinfo.code]={value:functions.fieldvalue(target,fieldinfo)};
							}
							else
							{
								/* register */
								method='POST';
								body={
									app:kintone.app.getId(),
									record:{}
								};
								$.each(vars.fieldinfo,function(index,values){
									var element=row.find('td').eq(index+1).find('input,select,texarea');
									var fieldinfo=values;
									record[fieldinfo.code]={value:functions.fieldvalue(element,fieldinfo)};
								});
							}
							body.record=record;
							kintone.api(kintone.api.url('/k/v1/record',true),method,body,function(resp){
								row.find('td').eq(0).find('label').text(resp.id);
							},function(error){
								alert(error.message);
								target.focus();
							});
						}
					})));
					/* append request fields */
					fields.push(fieldinfo.code);
					/* append fieldinfo */
					vars.fieldinfo.push(fieldinfo);
				}
			});
			/* create button field */
			vars.template.append($('<td class="buttoncell">').append($('<button>').text('X').on('click',function(){
				var row=$(this).closest('tr');
				var index=row.find('td').eq(0).find('label').text();
				if (index.length!=0)
				{
					if (!confirm('削除します。\n宜しいですか?')) return false;
					var method='DELETE';
					var body={
						app:kintone.app.getId(),
						ids:[index]
					};
					kintone.api(kintone.api.url('/k/v1/records',true),method,body,function(resp){
						vars.rows.remove(row);
					},function(error){});
				}
			})));
			/* append header */
			vars.header.append(row.append($('<th>').text('')));
			/* get records */
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQuery(),
				fields:fields
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				var records=resp.records;
				/* create rows */
				$.each(records,function(index,values){
					var record=values
					var row=vars.template.clone(true);
					/* setup field values */
					row.find('td').eq(0).find('label').text(record['$id'].value);
					$.each(vars.fieldinfo,function(index,values){
						var cell=row.find('td').eq(index+1);
						var fieldinfo=values;
						var field=record[fieldinfo.code];
						switch (fieldinfo.type)
						{
							case 'SINGLE_LINE_TEXT':
							case 'NUMBER':
							case 'DATE':
							case 'TIME':
							case 'DATETIME':
							case 'LINK':
								cell.find('input').val(field.value);
								break;
							case 'MULTI_LINE_TEXT':
								cell.find('textarea').val(field.value);
								break;
							case 'CHECK_BOX':
							case 'MULTI_SELECT':
								if (field.value!=null) cell.find('select').val(field.value.toString().split(' '));
							case 'RADIO_BUTTON':
							case 'DROP_DOWN':
								cell.find('select').val(field.value);
								break;
						}
					});
					/* append row */
					vars.rows.append(row);
				});
				/* append new row */
				vars.rows.append(vars.template.clone(true));
		   },function(error){});
		},function(error){});
		/* append grid */
		vars.container.append($('<table id="grideditor">').append(vars.header).append(vars.rows));
		/* load complete */
		vars.loaded=true;
	});
})(jQuery,kintone.$PLUGIN_ID);
