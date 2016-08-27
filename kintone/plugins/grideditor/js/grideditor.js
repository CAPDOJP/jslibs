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
		grid:null,
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
		/* create field */
		createfield:function(fieldinfo){
			var cell=null;
			var date=new Date();
			var placeholder='';
			switch (fieldinfo.type)
			{
				case 'SINGLE_LINE_TEXT':
				case 'LINK':
					cell=$('<input type="text">');
					break;
				case 'NUMBER':
					cell=$('<input type="text" class="right">');
					break;
				case 'MULTI_LINE_TEXT':
					cell=$('<textarea>');
					break;
				case 'CHECK_BOX':
				case 'MULTI_SELECT':
					cell=$('<select multiple="multiple">');
					cell.append($('<option>').attr('value','').text(''));
					$.each(fieldinfo.options,function(index,value){
						cell.append($('<option>').attr('value',value).text(value));
					});
				case 'RADIO_BUTTON':
				case 'DROP_DOWN':
					cell=$('<select>');
					cell.append($('<option>').attr('value','').text(''));
					$.each(fieldinfo.options,function(index,value){
						cell.append($('<option>').attr('value',value).text(value));
					});
					break;
				case 'DATE':
					placeholder+=date.format('Y-m-d');
					cell=$('<input type="text" placeholder="ex) '+placeholder+'">');
					break;
				case 'TIME':
					placeholder+=date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2);
					cell=$('<input type="text" placeholder="ex) '+placeholder+'">');
					break;
				case 'DATETIME':
					placeholder+=date.format('Y-m-d');
					placeholder+='T'+date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2)+':'+date.getSeconds().toString().lpad('0',2)+'Z';
					cell=$('<input type="text" placeholder="ex) '+placeholder+'">');
					break;
			}
			return cell
			.onvaluechanging(function(target){
				var empty=true;
				$.each(vars.rows.find('tr').last().find('td'),function(index,value){
					var cell=$(this).find('input,select,texarea');
				    if (cell.val()!=null)
				    	if (cell.val().toString().length!=0) empty=false;
				})
				/* append new row */
				if (!empty) vars.rows.append(vars.template.clone(true));
			})
			.onvaluechanged(function(target){
				if (vars.loaded)
				{
					var row=target.closest('tr');
					var index=row.find('td').first().find('label').text();
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
							record[values.code]={value:functions.fieldvalue(row.find('td').eq(index+1).find('input,select,texarea'),values)};
						});
					}
					body.record=record;
					kintone.api(kintone.api.url('/k/v1/record',true),method,body,function(resp){
						row.find('td').first().find('label').text(resp.id);
					},function(error){
						alert(error.message);
						target.focus();
					});
				}
			});
		},
		/* get field value */
		fieldvalue:function(cell,fieldinfo){
			var fieldvalue=(cell.val()==null)?'':cell.val().toString();
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
	   	vars.grid=$('<table id="grideditor">');
	   	vars.header=$('<tr>');
	   	vars.rows=$('<tbody>');
	   	vars.template=$('<tr>');
		/* append elements */
		vars.grid.append($('<thead>').append(vars.header));
		vars.grid.append(vars.rows);
		vars.container.append(vars.grid);
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:kintone.app.getId()},function(resp){
			var displayfields=['$id'];
			/* create header and template */
			vars.header.append($('<th>').text('No'));
	   		vars.template.append($('<td>').append($('<label>')));
			$.each(resp.properties,function(index,values){
				/* check disabled type */
				if (values.type in vars.disabled)
				{
					var message='';
					message+='以下のフィールドが配置されている場合は使用出来ません。\n\n';
					$.each(vars.disabled,function(key,value){
						message+=value+'\n';
					});
					alert(message);
					vars.grid.hide();
					return;
				}
				/* check exclude type */
				if ($.inArray(values.type,vars.exclude)<0)
				{
					/* append header field */
					vars.header.append($('<th>').text(values.label));
					/* append template field */
					vars.template.append($('<td>').append(functions.createfield(values)));
					/* append display fields */
					displayfields.push(values.code);
					/* append fieldinfo */
					vars.fieldinfo.push(values);
				}
			});
			/* append header field */
			vars.header.append($('<th>').text(''));
			/* append button field */
			vars.template.append($('<td class="buttoncell">').append($('<button>').text('X').on('click',function(){
				var row=$(this).closest('tr');
				var index=row.find('td').first().find('label').text();
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
			/* get records */
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQuery(),
				fields:displayfields
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				var records=resp.records;
				/* create row */
				$.each(records,function(index,values){
					var record=values
					var row=vars.template.clone(true);
					/* setup field values */
					row.find('td').first().find('label').text(record['$id'].value);
					$.each(vars.fieldinfo,function(index,values){
						var cell=row.find('td').eq(index+1).find('input,select,texarea');
						var field=record[values.code];
						switch (values.type)
						{
							case 'CHECK_BOX':
							case 'MULTI_SELECT':
								if (field.value!=null) cell.val(field.value.toString().split(' '));
							default:
								cell.val(field.value);
								break;
						}
					});
					/* append row */
					vars.rows.append(row);
				});
				/* append new row */
				vars.rows.append(vars.template.clone(true));
				/* focus */
				vars.rows.find('input,select,texarea').first().focus();
		   },function(error){});
		},function(error){});
		/* load complete */
		vars.loaded=true;
	});
})(jQuery,kintone.$PLUGIN_ID);
