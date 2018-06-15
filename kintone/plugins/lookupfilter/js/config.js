/*
*--------------------------------------------------------------------
* jQuery-Plugin "lookupfilter -config.js-"
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		lookuptable:null,
		segmenttable:[]
	};
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
					case 'SUBTABLE':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
				}
			});
			return codes;
		},
		loadapps:function(row,callback){
			var index=vars.lookuptable.rows.index(row);
			kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:$('input#lookupapp',row).val()},function(resp){
				var sorted=functions.fieldsort(resp.layout);
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:$('input#lookupapp',row).val()},function(resp){
					$.each(sorted,function(index){
						if (sorted[index] in resp.properties)
						{
							var fieldinfo=resp.properties[sorted[index]];
							/* check field type */
							switch (fieldinfo.type)
							{
								case 'CATEGORY':
								case 'CHECK_BOX':
								case 'CREATED_TIME':
								case 'CREATOR':
								case 'FILE':
								case 'GROUP':
								case 'GROUP_SELECT':
								case 'MODIFIER':
								case 'MULTI_LINE_TEXT':
								case 'MULTI_SELECT':
								case 'ORGANIZATION_SELECT':
								case 'REFERENCE_TABLE':
								case 'RICH_TEXT':
								case 'STATUS':
								case 'STATUS_ASSIGNEE':
								case 'SUBTABLE':
								case 'UPDATED_TIME':
								case 'USER_SELECT':
									break;
								default:
									if (fieldinfo.required || fieldinfo.type=='RECORD_NUMBER')
									{
										if (fieldinfo.code!=$('input#lookuprelatedkey',row).val())
											$('select#segment',row).append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#display',row).append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									}
									break;
							}
						}
					});
					vars.segmenttable[index]=$('.segments',row).adjustabletable({
						add:'img.add',
						del:'img.del'
					});
					if (callback!=null) callback(row,vars.segmenttable[index]);
				});
			},function(error){});
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
			var row=null;
			var lookups=(Object.keys(config).length!==0)?JSON.parse(config['lookup']):{};
			var fieldinfos=$.fieldparallelize(resp.properties);
			/* initialize valiable */
			vars.lookuptable=$('.lookups').adjustabletable({});
			vars.lookuptable.clearrows();
			$.each(sorted,function(index){
				if (sorted[index] in fieldinfos)
				{
					var fieldinfo=fieldinfos[sorted[index]];
					/* check field type */
					if (fieldinfo.lookup)
					{
						vars.lookuptable.addrow();
						row=vars.lookuptable.rows.last();
						$('input#lookupapp',row).val(fieldinfo.lookup.relatedApp.app);
						$('input#lookupcode',row).val(fieldinfo.code);
						$('input#lookuprelatedkey',row).val(fieldinfo.lookup.relatedKeyField);
						$('input#tablecode',row).val(fieldinfo.tablecode);
						$('span.lookupname',row).text(fieldinfo.label);
					}
				}
			});
			vars.segmenttable=[vars.lookuptable.rows.length];
			for (var i=0;i<vars.lookuptable.rows.length;i++)
			{
				functions.loadapps(vars.lookuptable.rows.eq(i),function(row,table){
					var add=false;
					var segments=[];
					if ($('input#lookupcode',row).val() in lookups)
					{
						$('select#display',row).val(lookups[$('input#lookupcode',row).val()].display);
						segments=lookups[$('input#lookupcode',row).val()].segments;
						for (var i2=0;i2<segments.length;i2++)
						{
							if (add) table.addrow();
							else add=true;
							$('select#segment',table.rows.last()).val(segments[i2]);
						}
					}
				});
			}
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var rowlookup=null;
		var rowsegment=null;
		var lookups={};
		var config=[];
		var segments=[];
		for (var i=0;i<vars.lookuptable.rows.length;i++)
		{
			segments=[];
			rowlookup=vars.lookuptable.rows.eq(i);
			if ($('select#display',rowlookup).val()=='') continue;
			for (var i2=0;i2<vars.segmenttable[i].rows.length;i2++)
			{
				rowsegment=vars.segmenttable[i].rows.eq(i2);
				if ($('select#segment',rowsegment).val().length==0) continue;
				segments.push($('select#segment',rowsegment).val());
			}
			lookups[$('input#lookupcode',rowlookup).val()]={
				app:$('input#lookupapp',rowlookup).val(),
				display:$('select#display',rowlookup).val(),
				relatedkey:$('input#lookuprelatedkey',rowlookup).val(),
				tablecode:$('input#tablecode',rowlookup).val(),
				segments:segments
			};
		}
		/* setup config */
		config['lookup']=JSON.stringify(lookups);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);