/*
*--------------------------------------------------------------------
* jQuery-Plugin "referenceupdate -config.js-"
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
		lookuptable:null,
		settingtables:[],
		fieldinfos:{}
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
						vars.groups.push(values.code);
						$.merge(codes,functions.fieldsort(values.layout));
						break;
				}
			});
			return codes;
		},
		reloadsettings:function(settingtable,callback){
			/* clear rows */
			var target=$('select#lookup',settingtable.container.closest('tr'));
			settingtable.clearrows();
			if (target.val().length!=0)
			{
				var fieldinfo=vars.fieldinfos[target.val()];
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:fieldinfo.lookup.relatedApp.app},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:fieldinfo.lookup.relatedApp.app},function(resp){
						var mappings=[];
						$('input#lookuptype',settingtable.container.closest('tr')).val(resp.properties[fieldinfo.lookup.relatedKeyField].type);
						/* append lookup mappings fields */
						$.each(resp.properties,function(key,values){
							if (values.lookup)
								$.each(values.lookup.fieldMappings,function(index,values){
									mappings.push(values.field);
								});
						});
						if ($.inArray(fieldinfo.lookup.relatedKeyField,mappings)<0) mappings.push(fieldinfo.lookup.relatedKeyField);
						$.each(sorted,function(index){
							if (sorted[index] in resp.properties)
							{
								fieldinfo=resp.properties[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'CALC':
									case 'CATEGORY':
									case 'CREATED_TIME':
									case 'CREATOR':
									case 'FILE':
									case 'MODIFIER':
									case 'RECORD_NUMBER':
									case 'REFERENCE_TABLE':
									case 'STATUS':
									case 'STATUS_ASSIGNEE':
									case 'UPDATED_TIME':
										break;
									default:
										/* exclude lookup mappings */
										if ($.inArray(fieldinfo.code,mappings)<0)
										{
											var list=null;
											settingtable.addrow();
											$('input#updateto',settingtable.rows.last()).val(fieldinfo.code);
											$('input#updatetype',settingtable.rows.last()).val(fieldinfo.type);
											$('span.updatetoname',settingtable.rows.last()).text(fieldinfo.label);
											list=$('select#updatefrom',settingtable.rows.last());
											list.html('<option value=""></option>');
											$.each(vars.fieldinfos,function(key,values){
												if (fieldinfo.type==values.type) list.append($('<option>').attr('value',values.code).text(values.label));
											});
										}
								}
							}
						});
						settingtable.container.show();
						if (callback) callback();
					},function(error){settingtable.container.hide();});
				},function(error){settingtable.container.hide();});
			}
			else settingtable.container.hide();
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
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					if (fieldinfo.lookup) $('select#lookup').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
				}
			});
			/* initialize valiable */
			vars.lookuptable=$('.lookups').adjustabletable({
				add:'img.add',
				del:'img.del',
				addcallback:function(row){
					var index=(vars.lookuptable)?vars.lookuptable.rows.index(row):0;
					vars.settingtables.push($('.settings',row).adjustabletable());
					$('select#lookup',row).on('change',function(){
						functions.reloadsettings(vars.settingtables[index]);
					});
				},
				delcallback:function(index){
					vars.settingtables.splice(index,1);
				}
			});
			var add=false;
			var row=null;
			var lookups=[];
			var settings={};
			if (Object.keys(config).length!==0)
			{
				lookups=JSON.parse(config['lookups']);
				for (var i=0;i<lookups.length;i++)
				{
					if (add) vars.lookuptable.addrow();
					else add=true;
					settings=lookups[i]['setting'];
					$('select#lookup',vars.lookuptable.rows.last()).val(lookups[i]['lookup']);
					(function(settingtable){
						functions.reloadsettings(settingtable,function(){
							for (var i2=0;i2<settingtable.rows.length;i2++)
							{
								row=settingtable.rows.eq(i2);
								if ($('#updateto',row).val() in settings) $('select#updatefrom',row).val(settings[$('#updateto',row).val()]);
							}
						});
					})(vars.settingtables[i]);
				}
			}
			else vars.settingtables[0].container.hide();
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var lookups=[];
		/* check values */
		for (var i=0;i<vars.lookuptable.rows.length;i++)
		{
			var lookup={lookup:'',setting:{},type:''};
			row=vars.lookuptable.rows.eq(i);
			if ($('select#lookup',row).val()=='') continue;
			else
			{
				lookup.lookup=$('select#lookup',row).val();
				lookup.type=$('input#lookuptype',row).val();
			}
			for (var i2=0;i2<vars.settingtables[i].rows.length;i2++)
			{
				row=vars.settingtables[i].rows.eq(i2);
				if ($('select#updatefrom',row).val().length==0) continue;
				lookup.setting[$('input#updateto',row).val()]=$('select#updatefrom',row).val();
			}
			lookups.push(lookup);
		}
		/* setup config */
		config['lookups']=JSON.stringify(lookups,'');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);