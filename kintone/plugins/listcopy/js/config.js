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
		appfields:{},
		viewfields:{},
		viewinfos:{},
		mappings:[],
		requires:[],
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
			var row=null;
			$('.copyfieldstitle').before(vars.keytemplate.clone(true));
			/* initialize valiable */
			vars.keyrows=$('.keyfields');
			/* events */
			row=vars.keyrows.last();
			$('img.add',row).on('click',function(){functions.addkey()});
			$('img.del',row).on('click',function(){functions.delkey($(this).closest('tr'))});
			$('select#keyfrom',row).on('change',function(){functions.switching($(this).closest('tr'),$(this).val());});
			functions.switching(row,'');
		},
		delkey:function(row){
			row.remove();
			/* initialize valiable */
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
		reloadapp:function(viewid,callback){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:$('select#copyapp').val()},function(resp){
				vars.viewfields={};
				vars.viewinfos={};
				$.each(resp.properties,function(key,values){
					/* append viewfields informations */
					if ($.inArray(values.type,vars.viewexcludes)<0) vars.viewfields[values.code]=values;
				});
				kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:$('select#copyapp').val()},function(resp){
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
					if (viewid.length!=0) $('select#copyview').val(viewid);
					functions.reloadview(callback);
				});
			});
		},
		reloadview:function(callback){
			var fields=vars.viewinfos[$('select#copyview').val()].fields;
			var code=null;
			var row=null;
			/* setup keyfields lists */
			row=vars.keytemplate;
			$('select#keyfrom',row).empty();
			$('select#keyfrom',row).append($('<option>').attr('value','').text('指定しない'));
			$.each(fields,function(index){
				code=fields[index];
				/* check exclude field */
				if (code in vars.viewfields)
					if (vars.viewfields[code].required || vars.viewfields[code].type=='RECORD_NUMBER')
						$('select#keyfrom',row).append($('<option>').attr('value',vars.viewfields[code].code).text(vars.viewfields[code].label));
			});
			/* create keyfields rows */
			if (vars.keyrows!=null) vars.keyrows.remove();
			functions.addkey();
			$('img.del',vars.keyrows.first()).css({'display':'none'});
			/* setup copyfields lists */
			for (var i=0;i<vars.copyrows.length;i++)
			{
				row=vars.copyrows.eq(i);
				$('input#sum',row).prop('disabled',true);
				$('select#copyfrom',row).empty();
				$('select#copyfrom',row).append($('<option>').attr('value','').text('コピーしない'));
				$.each(fields,function(index){
					code=fields[index];
					/* check exclude field */
					if (code in vars.viewfields)
						if ($.isvalidtype(vars.viewfields[code],vars.appfields[$('input#copyto',row).val()]))
							$('select#copyfrom',row).append($('<option>').attr('value',vars.viewfields[code].code).text(vars.viewfields[code].label));
				});
			};
			$('input#buttonlabel').val($('select#copyview option:selected').text()+'からデータを取得');
			if (callback!=null) callback();
		},
		summary:function(row){
			var code=$('select#copyfrom',row).val();
			var disabled=true;
			if (code.length!=0)
				if (!vars.viewfields[code].lookup)
				{
					switch (vars.viewfields[code].type)
					{
						case 'CALC':
							if (vars.viewfields[code].format.match(/^NUMBER/g)!=null) disabled=false;
							break;
						case 'NUMBER':
							disabled=false;
							break;
					}
				}
			if (disabled) $('input#sum',row).prop('checked',false);
			$('input#sum',row).prop('disabled',disabled);
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
		var row=null;
		/* initialize valiable */
		vars.copytemplate=$('.copyfields').find('tr').first().clone(true);
		vars.keytemplate=$('.keyfields').first().clone(true);
		$.each(resp.properties,function(key,values){
			if (values.lookup)
			{
				$.each(values.lookup.fieldMappings,function(index,values){
					if ($.inArray(values.field,vars.mappings)<0) vars.mappings.push(values.field);
				});
			}
			if (values.required) vars.requires.push(values);
		});
		/* setup keyfields lists */
		row=vars.keytemplate;
		$('select#keyto',row).empty();
		$.each(resp.properties,function(key,values){
			if ($.inArray(values.type,vars.keyexcludes)<0) $('select#keyto',row).append($('<option>').attr('value',values.code).text(values.label));
		});
		/* create keyfields rows */
		if (vars.keyrows!=null) vars.keyrows.remove();
		functions.addkey();
		$('img.del',vars.keyrows.first()).css({'display':'none'});
		/* create copyfields rows */
		$('.copyfields').empty();
		$.each(resp.properties,function(key,values){
			if ($.inArray(values.code,vars.mappings)<0 && $.inArray(values.type,vars.appexcludes)<0)
			{
				row=vars.copytemplate.clone(true);
				$('input#sum',row).prop('disabled',true);
				$('input#copyto',row).val(values.code);
				$('span#copytoname',row).text(values.label);
				$('.copyfields').append(row);
				/* append appfields informations */
				vars.appfields[values.code]=values;
				/* events */
				$('select#copyfrom',row).on('change',function(){functions.summary($(this).closest('tr'));});
			}
		});
		vars.copyrows=$('.copyfields').find('tr');
		functions.loadapps(function(){
			/* setup config */
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			if (Object.keys(config).length!==0)
			{
				$('select#copyapp').val(config['copyapp']);
				$('input#buttonlabel').val(config['buttonlabel']);
				functions.reloadapp(config['copyview'],function(){
					var add=false;
					var copyfields=JSON.parse(config['copyfields']);
					var keyfields=JSON.parse(config['keyfields']);
					var sumfields=JSON.parse(config['sumfields']);
					for (var i=0;i<vars.copyrows.length;i++)
					{
						row=vars.copyrows.eq(i);
						$('select#copyfrom',row).val(copyfields[$('input#copyto',row).val()]);
						$('input#sum',row).prop('checked',(sumfields[$('input#copyto',row).val()]=='1'));
						functions.summary(row);
					}
					$.each(keyfields,function(key,values){
						if (add) functions.addkey();
						else add=true;
						row=vars.keyrows.last();
						$('select#keyfrom',row).val(values);
						$('select#keyto',row).val(key);
						functions.switching(row,values);
					});
				});
			}
			else functions.reloadapp('',null);
			/* events */
			$('select#copyapp').on('change',function(){functions.reloadapp('',null)});
			$('select#copyview').on('change',function(){functions.reloadview()});
		});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var errormessage='';
		var row=null;
		var config=[];
		var copyfields={};
		var keyfields={};
		var sumfields={};
		for (var i=0;i<vars.copyrows.length;i++)
		{
			row=vars.copyrows.eq(i);
			copyfields[$('input#copyto',row).val()]=$('select#copyfrom',row).val();
			sumfields[$('input#copyto',row).val()]=($('input#sum',row).prop('checked'))?'1':'0';
			/* check equired fields */
			vars.requires.some(function(value,index){
				if (value.code==$('input#copyto',row).val() && $('select#copyfrom',row).val().length!=0) vars.requires.splice(index,1);
			});
		}
		for (var i=0;i<vars.keyrows.length;i++)
		{
			row=vars.keyrows.eq(i);
			if ($('select#keyfrom',row).val().length!=0)
			{
				/* check key field */
				if (copyfields[$('select#keyto',row).val()].length==0)
				{
					swal('Error!','キーに指定したフィールドはコピー先を指定して下さい。','error');
					error=true;
					return false;
				}
				keyfields[$('select#keyto',row).val()]=$('select#keyfrom',row).val();
			}
		}
		if (error) return;
		if (Object.keys(keyfields).length==0 && vars.requires.length!=0)
		{
			for (var i=0;i<vars.requires.length;i++) errormessage+='\n'+vars.requires[i].label;
			swal('Error!','以下のフィールドは必須入力となっています。'+errormessage,'error');
			return;
		}
	    if ($('input#buttonlabel').val()=='')
	    {
	    	swal('Error!','コピーボタンラベルを入力して下さい。','error');
	    	return;
	    }
		/* setup config */
		config['copyview']=$('select#copyview').val();
		config['copyapp']=$('select#copyapp').val();
		config['copyfields']=JSON.stringify(copyfields);
		config['keyfields']=JSON.stringify(keyfields);
		config['sumfields']=JSON.stringify(sumfields);
		config['buttonlabel']=$('input#buttonlabel').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);