/*
*--------------------------------------------------------------------
* jQuery-Plugin "listcopy -config.js-"
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
		offset:0,
		copyrows:null,
		copytemplate:null,
		keyrows:null,
		keytemplate:null,
		fieldinfos:{},
		viewinfos:{},
		appexcludes:[
			'CALC',
			'CATEGORY',
			'CREATED_TIME',
			'CREATOR',
			'GROUP',
			'MODIFIER',
			'RECORD_NUMBER',
			'REFERENCE_TABLE',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE',
			'UPDATED_TIME'
		],
		keyexcludes:[
			'CATEGORY',
			'CREATED_TIME',
			'CREATOR',
			'GROUP',
			'MODIFIER',
			'REFERENCE_TABLE',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE',
			'UPDATED_TIME'
		],
		viewexcludes:[
			'CATEGORY',
			'CREATED_TIME',
			'CREATOR',
			'MODIFIER',
			'REFERENCE_TABLE',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE',
			'UPDATED_TIME'
		]
	};
	var functions={
		addkey:function(){
			$('.copyfieldstitle').before(vars.keytemplate.clone(true));
			vars.keyrows=$('.keyfields');
			/* switch view of button */
			$('img.del',vars.keyrows.first()).css({'display':'none'});
			/* events */
			$('img.add',vars.keyrows.last()).on('click',function(){functions.addkey()});
			$('img.del',vars.keyrows.last()).on('click',function(){functions.delkey($(this).closest('tr'))});
			$('select#keyfrom',vars.keyrows.last()).on('change',function(){functions.switching($(this).closest('tr'),$(this).val());});
			functions.switching(vars.keyrows.last(),'');
		},
		delkey:function(row){
			row.remove();
			vars.keyrows=$('.keyfields');
		},
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId()) $('select#copyapp').append($('<option>').attr('value',values.appId).text(values.name));
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		},
		reloadapp:function(callback){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:$('select#copyapp').val()},function(resp){
				var mappings=[];
				var row=null;
				/* append lookup exclude fields */
				$.each(resp.properties,function(key,values){
					if (values.lookup)
					{
						$.each(values.lookup.fieldMappings,function(index,values){
							if ($.inArray(values.field,mappings)<0) mappings.push(values.field);
						});
					}
				});
				/* initialize key fields elements */
				row=vars.keytemplate;
				$('select#keyto',row).empty();
				$.each(resp.properties,function(key,values){
					if ($.inArray(values.type,vars.keyexcludes)<0) $('select#keyto',row).append($('<option>').attr('value',values.code).text(values.label));
				});
				/* create keyfields rows */
				if (vars.keyrows!=null) vars.keyrows.remove();
				functions.addkey();
				/* initialize copy fields elements */
				for (var i=0;i<vars.copyrows.length;i++)
				{
					$('select#copyto',vars.copyrows.eq(i)).empty();
					$('select#copyto',vars.copyrows.eq(i)).append($('<option>').attr('value','').text('コピーしない'));
					$.each(resp.properties,function(key,values){
						/* check exclude field */
						if ($.inArray(values.code,mappings)<0 && $.inArray(values.type,vars.appexcludes)<0)
							if ($.isvalidtype(vars.fieldinfos[$('input#copyfrom',vars.copyrows.eq(i)).val()],values))
								$('select#copyto',vars.copyrows.eq(i)).append($('<option>').attr('value',values.code).text(values.label));
					});
				};
				if (callback!=null) callback();
			});
		},
		reloadview:function(callback){
			var fields=vars.viewinfos[$('select#copyview').val()].fields;
			var row=null;
			/* initialize key fields elements */
			row=vars.keytemplate;
			$('select#keyfrom',row).empty();
			$('select#keyfrom',row).append($('<option>').attr('value','').text('指定しない'));
			$.each(fields,function(index){
				if (fields[index] in vars.fieldinfos)
					if (vars.fieldinfos[fields[index]].required || vars.fieldinfos[fields[index]].type=='RECORD_NUMBER')
						$('select#keyfrom',row).append($('<option>').attr('value',vars.fieldinfos[fields[index]].code).text(vars.fieldinfos[fields[index]].label));
			});
			/* create keyfields rows */
			if (vars.keyrows!=null) vars.keyrows.remove();
			functions.addkey();
			/* create copyfields rows */
			$('.copyfields').empty();
			$.each(fields,function(index){
				if (fields[index] in vars.fieldinfos)
				{
					var disabled=true;
					if (!vars.fieldinfos[fields[index]].lookup)
					{
						switch (vars.fieldinfos[fields[index]].type)
						{
							case 'CALC':
								if (vars.fieldinfos[fields[index]].format.match(/^NUMBER/g)!=null) disabled=false;
								break;
							case 'NUMBER':
								disabled=false;
								break;
						}
					}
					row=vars.copytemplate.clone(true);
					$('input#sum',row).prop('disabled',disabled);
					$('input#copyfrom',row).val(vars.fieldinfos[fields[index]].code);
					$('span#copyfromname',row).text(vars.fieldinfos[fields[index]].label);
					$('.copyfields').append(row);
				}
			});
			vars.copyrows=$('.copyfields').find('tr');
			if (callback!=null) callback();
		},
		switching:function(row,value){
			if (value.length==0)
			{
				$('div.switch',row).css({'display':'none'});
				$('span.switch',row).css({'display':'inline-block'});
			}
			else
			{
				$('div.switch',row).css({'display':'inline-block'});
				$('span.switch',row).css({'display':'none'});
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.properties,function(key,values){
			/* setup field informations */
			if ($.inArray(values.type,vars.viewexcludes)<0) vars.fieldinfos[values.code]=values;
		});
		kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			var error=true;
			/* setup view lists */
			$('select#copyview').empty();
			$.each(resp.views,function(key,values){
				if (values.type.toUpperCase()=='LIST')
				{
					$('select#copyview').append($('<option>').attr('value',values.id).text(key));
					vars.viewinfos[values.id]=values;
					error=false;
				}
			});
			if (error)
			{
				swal('Error!','表形式の一覧が作成されていません。','error');
				return;
			}
			/* initialize valiable */
			vars.copytemplate=$('.copyfields').find('tr').first().clone(true);
			vars.keytemplate=$('.keyfields').first().clone(true);
			/* setup config */
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			if (Object.keys(config).length!==0) $('select#copyview').val(config['copyview']);
			functions.reloadview();
			vars.offset=0;
			$('select#copyapp').empty();
			functions.loadapps(function(){
				/* setup config */
				if (Object.keys(config).length!==0)
				{
					$('select#copyapp').val(config['copyapp']);
					functions.reloadapp(function(){
						var add=false;
						var row=0;
						var copyfields=JSON.parse(config['copyfields']);
						var keyfields=JSON.parse(config['keyfields']);
						var sumfields=JSON.parse(config['sumfields']);
						for (var i=0;i<vars.copyrows.length;i++)
						{
							$('select#copyto',vars.copyrows.eq(i)).val(copyfields[$('input#copyfrom',vars.copyrows.eq(i)).val()]);
							$('input#sum',vars.copyrows.eq(i)).prop('checked',(sumfields[$('input#copyfrom',vars.copyrows.eq(i)).val()]=='1'));
						}
						$.each(keyfields,function(key,values){
							if (add) functions.addkey();
							else add=true;
							row=vars.keyrows.last();
							$('select#keyfrom',row).val(key);
							$('select#keyto',row).val(values);
							functions.switching(row,key);
						});
					});
				}
				else functions.reloadapp();
				/* events */
				$('select#copyview').on('change',function(){functions.reloadview(function(){functions.reloadapp()})});
				$('select#copyapp').on('change',function(){functions.reloadapp()});
			});
		});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var config=[];
		var copyfields={};
		var keyfields={};
		var sumfields={};
		for (var i=0;i<vars.copyrows.length;i++)
		{
			copyfields[$('input#copyfrom',vars.copyrows.eq(i)).val()]=$('select#copyto',vars.copyrows.eq(i)).val();
			sumfields[$('input#copyfrom',vars.copyrows.eq(i)).val()]=($('input#sum',vars.copyrows.eq(i)).prop('checked'))?'1':'0';
		}
		for (var i=0;i<vars.keyrows.length;i++)
		{
			if ($('select#keyfrom',vars.keyrows.eq(i)).val().length!=0)
			{
				/* check key field */
				if (copyfields[$('select#keyfrom',vars.keyrows.eq(i)).val()].length==0)
				{
					swal('Error!','キーに指定したフィールドはコピー先を指定して下さい。','error');
					error=true;
					return false;
				}
				keyfields[$('select#keyfrom',vars.keyrows.eq(i)).val()]=$('select#keyto',vars.keyrows.eq(i)).val();
			}
		}
		if (error) return;
		/* setup config */
		config['copyview']=$('select#copyview').val();
		config['copyapp']=$('select#copyapp').val();
		config['copyfields']=JSON.stringify(copyfields);
		config['keyfields']=JSON.stringify(keyfields);
		config['sumfields']=JSON.stringify(sumfields);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);