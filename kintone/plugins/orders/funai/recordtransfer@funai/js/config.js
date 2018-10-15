/*
*--------------------------------------------------------------------
* jQuery-Plugin "recordtransfer -config.js-"
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
			vars.fieldinfos=resp.properties;
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'SINGLE_LINE_TEXT':
							$('select#recordid').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			if (Object.keys(config).length!==0)
			{
				$('input#subdomain').val(config['subdomain']);
				$('input#guest').val(config['guest']);
				$('input#appid').val(config['appid']);
				$('input#token').val(config['token']);
				$('input#decisionfield').val(config['decisionfield']);
				$('input#decisionvalue').val(config['decisionvalue']);
				$('select#recordid').val(config['recordid']);
			}
		},function(error){swal('Error!',error.message,'error');});
	},function(error){swal('Error!',error.message,'error');});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		if ($('input#subdomain').val()=='')
		{
			swal('Error!','コピー先サブドメインを入力して下さい。','error');
			return;
		}
		if ($('input#appid').val()=='')
		{
			swal('Error!','コピー先アプリIDを入力して下さい。','error');
			return;
		}
		if ($('input#token').val()=='')
		{
			swal('Error!','コピー先APIトークンを入力して下さい。','error');
			return;
		}
		if ($('select#recordid').val()=='')
		{
			swal('Error!','レコード番号保存フィールドを指定して下さい。','error');
			return;
		}
		if ($('input#decisionfield').val()=='' && $('input#decisionvalue').val()!='')
		{
			swal('Error!','コピー元判定フィールドコードを入力して下さい。','error');
			return;
		}
		if ($('input#decisionfield').val()!='' && $('input#decisionvalue').val()=='')
		{
			swal('Error!','コピー元判定値を入力して下さい。','error');
			return;
		}
		/* setup config */
		config['subdomain']=$('input#subdomain').val();
		config['guest']='/'+$('input#guest').val().replace(/^\//g,'').replace(/\/$/g,'');
		config['appid']=$('input#appid').val();
		config['token']=$('input#token').val();
		config['decisionfield']=$('input#decisionfield').val();
		config['decisionvalue']=$('input#decisionvalue').val();
		config['recordid']=$('select#recordid').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);