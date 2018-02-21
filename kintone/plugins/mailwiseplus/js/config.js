/*
*--------------------------------------------------------------------
* jQuery-Plugin "mailwiseplus -config.js-"
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
		historymailtable:null
	};
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId()) $('select#templateapp').append($('<option>').attr('value',values.appId).text(values.name));
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
			$('select[id^=template]:not(#templateapp)').empty();
			$('select[id^=template]:not(#templateapp)').append($('<option>').attr('value','').text(''));
			if ($('select#templateapp').val().length==0) $('select[id^=template]:not(#templateapp)').closest('.kintoneplugin-row').hide();
			else
			{
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:$('select#templateapp').val()},function(resp){
					$.each(resp.properties,function(key,values){
						/* check field type */
						switch (values.type)
						{
							case 'DROP_DOWN':
							case 'RADIO_BUTTON':
								$('select#templatesegment').append($('<option>').attr('value',values.code).text(values.label));
								break;
							case 'SINGLE_LINE_TEXT':
								$('select#templatename').append($('<option>').attr('value',values.code).text(values.label));
								$('select#templatesubject').append($('<option>').attr('value',values.code).text(values.label));
								break;
							case 'MULTI_LINE_TEXT':
							case 'RICH_TEXT':
								$('select#templatebody').append($('<option>').attr('value',values.code).text(values.label));
								break;
						}
					});
					$('select[id^=template]:not(#templateapp)').closest('.kintoneplugin-row').show();
					if (callback!=null) callback();
				});
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.properties,function(index,values){
			/* check field type */
			switch (values.type)
			{
				case 'LINK':
					if (values.protocol=='MAIL')
					{
						$('select#mailto').append($('<option>').attr('value',values.code).text(values.label));
						$('select#mailcc').append($('<option>').attr('value',values.code).text(values.label));
						$('select#mailbcc').append($('<option>').attr('value',values.code).text(values.label));
						$('select#historymail').append($('<option>').attr('value',values.code).text(values.label));
					}
					break;
				case 'SPACER':
					$('select#historyspace').append($('<option>').attr('value',values.elementId).text(values.elementId));
					break;
			}
		});
		/* initialize valiable */
		vars.historymailtable=$('.historymails').adjustabletable({
			add:'img.add',
			del:'img.del'
		});
		functions.loadapps(function(){
			var add=false;
			var row=null;
			var historymails=[];
			/* setup config */
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			if (Object.keys(config).length!==0)
			{
				historymails=config['historymails'].split(',');
				$('select#mailto').val(config['mailto']);
				$('select#mailcc').val(config['mailcc']);
				$('select#mailbcc').val(config['mailbcc']);
				$('select#historyspace').val(config['historyspace']);
				$('select#templateapp').val(config['templateapp']);
				if (config['normal']=='1') $('input#normal').prop('checked',true);
				if (config['bulk']=='1') $('input#bulk').prop('checked',true);
				$.each(historymails,function(index){
					if (add) vars.historymailtable.addrow();
					else add=true;
					row=vars.historymailtable.rows.last();
					$('select#historymail',row).val(historymails[index]);
				});
				functions.reloadapp(function(){
					$('select#templatesegment').val(config['templatesegment']);
					$('select#templatename').val(config['templatename']);
					$('select#templatesubject').val(config['templatesubject']);
					$('select#templatebody').val(config['templatebody']);
				});
			}
			else functions.reloadapp(null);
			/* events */
			$('input#normal').on('change',function(){
				if ($(this).prop('checked'))
				{
					$('select#mailcc').closest('.kintoneplugin-row').show();
					$('select#mailbcc').closest('.kintoneplugin-row').show();
					$('select#historyspace').closest('.kintoneplugin-row').show();
					$('select#historymail').closest('.kintoneplugin-row').show();
				}
				else
				{
					$('select#mailcc').closest('.kintoneplugin-row').hide();
					$('select#mailbcc').closest('.kintoneplugin-row').hide();
					$('select#historyspace').closest('.kintoneplugin-row').hide();
					$('select#historymail').closest('.kintoneplugin-row').hide();
				}
			}).trigger('change');
			$('select#templateapp').on('change',function(){functions.reloadapp(null)});
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var key='';
		var row=null;
		var config=[];
		var historymails=[];
		/* check values */
		if ($('select#mailto').val()=='')
		{
			swal('Error!','送信先(To)フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailto').val()==$('select#mailcc').val())
		{
			swal('Error!','送信先(To)フィールドと送信先(CC)フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailto').val()==$('select#mailbcc').val())
		{
			swal('Error!','送信先(To)フィールドと送信先(BCC)フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailcc').val().length+$('select#mailbcc').val().length!=0)
			if ($('select#mailcc').val()==$('select#mailbcc').val())
			{
				swal('Error!','送信先(CC)フィールドと送信先(BCC)フィールドは異なるフィールドを選択して下さい。','error');
				return;
			}
		for (var i=0;i<vars.historymailtable.rows.length;i++)
		{
			row=vars.historymailtable.rows.eq(i);
			if ($('select#historymail',row).val().length!=0) historymails.push($('select#historymail',row).val());
		}
		/* setup config */
		config['mailto']=$('select#mailto').val();
		config['mailcc']=$('select#mailcc').val();
		config['mailbcc']=$('select#mailbcc').val();
		config['historyspace']=$('select#historyspace').val();
		config['historymails']=historymails.join(',');
		config['templateapp']=$('select#templateapp').val();
		config['templatesegment']=$('select#templatesegment').val();
		config['templatename']=$('select#templatename').val();
		config['templatesubject']=$('select#templatesubject').val();
		config['templatebody']=$('select#templatebody').val();
		config['normal']=($('input#normal').prop('checked'))?'1':'0';
		config['bulk']=($('input#bulk').prop('checked'))?'1':'0';
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);