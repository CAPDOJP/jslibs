/*
*--------------------------------------------------------------------
* jQuery-Plugin "grideditor -config.js-"
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
	var vars={
		fieldtable:null
	};
	var VIEW_NAME='一括編集';
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
				}
			});
			return codes;
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
		var sorted=functions.fieldsort(resp.layout);
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			$.each(sorted,function(index){
				if (sorted[index] in resp.properties)
				{
					var fieldinfo=resp.properties[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
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
							$('select#field').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							switch (fieldinfo.type)
							{
								case 'NUMBER':
									/* exclude lookup */
									if (!fieldinfo.lookup.relatedApp)
									{
										/* check scale */
										if (fieldinfo.displayScale)
											if (fieldinfo.displayScale>8)
											{
												$('select#lat').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
												$('select#lng').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
											}
									}
									break;
								case 'SINGLE_LINE_TEXT':
									/* exclude lookup */
									if (!fieldinfo.lookup.relatedApp) $('select#address').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
							}
							break;
					}
				}
			});
			vars.fieldtable=$('.fields').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var row=null;
			var fields=[];
			if (Object.keys(config).length!==0)
			{
				fields=config['field'].split(',');
				$('select#address').val(config['address']);
				$('select#lat').val(config['lat']);
				$('select#lng').val(config['lng']);
				if (config['fieldselect']=='1') $('input#fieldselect').prop('checked',true);
				$.each(fields,function(index){
					if (add) vars.fieldtable.addrow();
					else add=true;
					row=vars.fieldtable.rows.last();
					$('select#field',row).val(fields[index]);
				});
			}
			/* events */
			$('input#fieldselect').on('change',function(){
				if ($(this).prop('checked')) vars.fieldtable.container.show();
				else vars.fieldtable.container.hide();
			}).trigger('change');
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var fields=[];
		/* check values */
		if ($('select#address').val()!='')
		{
			if ($('select#lat').val()=='')
			{
				swal('Error!','緯度表示フィールドを選択して下さい。','error');
				return;
			}
			if ($('select#lng').val()=='')
			{
				swal('Error!','経度表示フィールドを選択して下さい。','error');
				return;
			}
			if ($('select#lat').val()==$('select#lng').val())
			{
				swal('Error!','緯度表示フィールドと経度表示フィールドは異なるフィールドを選択して下さい。','error');
				return;
			}
		}
		for (var i=0;i<vars.fieldtable.rows.length;i++)
		{
			row=vars.fieldtable.rows.eq(i);
			if ($('select#field',row).val().length!=0) fields.push($('select#field',row).val());
		}
		var body={
			app:kintone.app.getId()
		};
		/* get view lists */
		kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'GET',body,function(resp){
			var req=$.extend(true,{},resp);
			req.app=kintone.app.getId();
			if (!req.views[VIEW_NAME])
			{
				/* swaps the index */
				for (var key in req.views) req.views[key].index=Number(req.views[key].index)+1;
				/* create custom view */
				req.views[VIEW_NAME]={
					type:'CUSTOM',
					name:VIEW_NAME,
					html:'<div id="grideditor-container" class="customview-container"></div>',
					filterCond:'',
					sort:'',
					pager:true,
					index:0
				};
			}
			/* save viewid */
			kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'PUT',req,function(resp){
				/* setup config */
				config['address']=$('select#address').val();
				config['lat']=$('select#lat').val();
				config['lng']=$('select#lng').val();
				config['lng']=$('select#lng').val();
				config['field']=fields.join(',');
				config['fieldselect']=($('input#fieldselect').prop('checked'))?'1':'0';
				config['grideditorview']=resp.views[VIEW_NAME].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);