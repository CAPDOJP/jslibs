/*
*--------------------------------------------------------------------
* jQuery-Plugin "chatworkuser -config.js-"
* Version: 3.0
* Copyright (c) 2018 TIS
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
							if (!values.elementId) codes.push(values.code);
							else $('select#spacer').append($('<option>').attr('value',values.elementId).text(values.elementId));
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
							$('select#account_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#name').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#chatwork_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#organization_name').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#department').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			if (Object.keys(config).length!==0)
			{
				$('select#account_id').val(config['account_id']);
				$('select#name').val(config['name']);
				$('select#chatwork_id').val(config['chatwork_id']);
				$('select#organization_name').val(config['organization_name']);
				$('select#department').val(config['department']);
				$('select#spacer').val(config['spacer']);
				$('input#client_id').val(config['client_id']);
				$('input#client_secret').val(config['client_secret']);
				if (config['regist']=='1') $('input#regist').prop('checked',true);
				if (config['history']=='1') $('input#history').prop('checked',true);
			}
			/* events */
			$('input#regist').on('change',function(){
				if ($(this).prop('checked')) $('.regist').show();
				else $('.regist').hide();
			}).trigger('change');
			$('input#history').on('change',function(){
				if ($(this).prop('checked')) $('.history').show();
				else $('.history').hide();
			}).trigger('change');
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#account_id').val()=='')
		{
			swal('Error!','アカウントIDフィールドを選択して下さい。','error');
			return;
		}
		if ($('input#client_id').val()=='')
		{
			swal('Error!','クライアントIDを入力して下さい。','error');
			return;
		}
		if ($('input#client_secret').val()=='')
		{
			swal('Error!','クライアントシークレットを入力して下さい。','error');
			return;
		}
		if ($('input#history').prop('checked'))
			if ($('select#spacer').val()=='')
			{
				swal('Error!','履歴表示スペースを選択して下さい。','error');
				return;
			}
		/* setup config */
		config['account_id']=$('select#account_id').val();
		config['name']=$('select#name').val();
		config['chatwork_id']=$('select#chatwork_id').val();
		config['organization_name']=$('select#organization_name').val();
		config['department']=$('select#department').val();
		config['spacer']=$('select#spacer').val();
		config['regist']=($('input#regist').prop('checked'))?'1':'0';
		config['history']=($('input#history').prop('checked'))?'1':'0';
		config['client_id']=$('input#client_id').val();
		config['client_secret']=$('input#client_secret').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);