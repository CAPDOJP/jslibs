/*
*--------------------------------------------------------------------
* jQuery-Plugin "relations -config.js-"
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
		appIds:{},
		appFields:{},
		appNames:{},
		isTable:{},
		relations:[],
		template:null,
		types:[
			'SINGLE_LINE_TEXT',
			'NUMBER',
			'MULTI_LINE_TEXT',
			'RADIO_BUTTON',
			'DROP_DOWN',
			'DATE',
			'TIME',
			'DATETIME',
			'LINK',
			'RECORD_NUMBER',
			'SUBTABLE'
		]
	};
	var functions={
		addbase:function(){
			$('div.block').first().append(vars.template.clone(true));
			$('div.block').first().find('div.relations').last().find('button#removebase').show();
		},
		addrelation:function(rows,row){
			var target=vars.template.find('tbody').find('tr').first().clone(true);
			target.find('select#basecode').html(rows.find('select#basecode').first().html()).val('');
			if (row==null) rows.append(target);
			else
			{
				if (rows.find('tr').index(row)==rows.find('tr').length-1) rows.append(target);
				else target.insertAfter(row);
			}
			target.find('button#removerelation').show();
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{},function(resp){
		/* setup app lists */
		$.each(resp.apps,function(index,values){
			if (values.appId!=kintone.app.getId())
			{
		    	$('select#relationapp').append($('<option>').attr('value',values.appId).text(values.name));
				vars.appNames[values.appId]=values.name;
			}
		})
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			/* setup field lists */
			$.each(resp.properties,function(key,values){
				if ($.inArray(values.type,vars.types)>-1)
				{
					switch (values.type)
					{
						case 'SUBTABLE':
							$.each(values.fields,function(key,values){
								if (values.lookup!=null)
								{
									$('select#basefield').append($('<option>').attr('value',values.code).text(values.label));
									vars.appIds[values.code]=values.lookup.relatedApp.app;
									vars.appFields[values.code]=values.lookup.relatedKeyField;
								}
								$('select#relationfield').append($('<option>').attr('value',values.code).text(values.label));
								vars.isTable[values.code]=true;
							});
							break;
						default:
							if (values.lookup!=null)
							{
								$('select#basefield').append($('<option>').attr('value',values.code).text(values.label));
								vars.appIds[values.code]=values.lookup.relatedApp.app;
								vars.appFields[values.code]=values.lookup.relatedKeyField;
							}
							$('select#relationfield').append($('<option>').attr('value',values.code).text(values.label));
							vars.isTable[values.code]=false;
							break;
					}
				}
			});
			/* lists action */
			$('select#basefield').on('change',function(){
				var app=vars.appNames[vars.appIds[$(this).val()]];
				var container=$(this).closest('div.relations');
				kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:vars.appIds[$(this).val()]},function(resp){
					/* setup field lists */
					$.each(container.find('select#basecode'),function(index){
						var list=$(this);
						list.html('<option value=""></option>');
						$.each(resp.properties,function(index,values){
							if ($.inArray(values.type,vars.types)>-1)
								if (values.type!='SUBTABLE')
									list.append($('<option>').attr('value',values.code).text('['+app+']'+values.label));
						});
			        	if ($.hasData(list[0]))
			        		if ($.data(list[0],'initialdata').length!=0)
			        		{
			        			list.val($.data(list[0],'initialdata'));
			        			$.data(list[0],'initialdata','');
			        		}
					});
				},function(error){});
			})
			$('select#relationapp').on('change',function(){
				var app=$(this).find('option:selected').text();
				var row=$(this).closest('tr');
				kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:$(this).val()},function(resp){
					/* setup field lists */
					$('select#relationappfield',row).html('<option value=""></option>');
					$('select#relationcode',row).html('<option value=""></option>');
					$.each(resp.properties,function(index,values){
						if ($.inArray(values.type,vars.types)>-1)
							if (values.type!='SUBTABLE')
							{
								$('select#relationappfield',row).append($('<option>').attr('value',values.code).text(values.label));
								$('select#relationcode',row).append($('<option>').attr('value',values.code).text('['+app+']'+values.label));
							}
					});
		        	if ($.hasData($('select#relationappfield',row)[0]))
		        		if ($.data($('select#relationappfield',row)[0],'initialdata').length!=0)
		        		{
		        			$('select#relationappfield',row).val($.data($('select#relationappfield',row)[0],'initialdata'));
		        			$.data($('select#relationappfield',row)[0],'initialdata','');
		        		}
		        	if ($.hasData($('select#relationcode',row)[0]))
		        		if ($.data($('select#relationcode',row)[0],'initialdata').length!=0)
		        		{
		        			$('select#relationcode',row).val($.data($('select#relationcode',row)[0],'initialdata'));
		        			$.data($('select#relationcode',row)[0],'initialdata','');
		        		}
				},function(error){});
			})
			/* buttons action */
			$('button#addbase').on('click',function(){
				functions.addbase();
			});
			$('button#addrelation').on('click',function(){
				functions.addrelation($(this).closest('tbody'),$(this).closest('tr'));
			});
			$('button#removebase').on('click',function(){
				$(this).closest('div.relations').remove();
			});
			$('button#removerelation').on('click',function(){
				$(this).closest('tr').remove();
			});
			/* initialize valiable */
			vars.template=$('div.relations').clone(true);
			/* setup config */
		    var config=kintone.plugin.app.getConfig(PLUGIN_ID);
	        if (Object.keys(config).length!==0)
			    $.each(JSON.parse(config['relations']),function(index,values){
			    	/* check row count */
			    	if ($('div.block').first().find('div.relations').length-1<index) functions.addbase();
			    	/* setup values */
			    	var container=$('div.block').first().find('div.relations').eq(index);
		        	$('select#basefield',container).val(values['basefield']);
		        	$.each(values['relations'],function(index,values){
				    	/* check row count */
				    	if ($('tbody',container).find('tr').length-1<index) functions.addrelation($('tbody',container));
				    	/* setup values */
				    	var row=$('tbody',container).find('tr').eq(index);
			        	$('select#relationfield',row).val(values['relationfield']);
			        	$('select#relationapp',row).val(values['relationapp']);
			        	if (values['rewrite']=='1') $('input#rewrite',row).prop('checked',true);
				    	/* trigger events */
			        	$.data($('select#relationappfield',row)[0],'initialdata',values['relationappfield']);
			        	$.data($('select#basecode',row)[0],'initialdata',values['basecode']);
			        	$.data($('select#relationcode',row)[0],'initialdata',values['relationcode']);
			        	$('select#relationapp',row).trigger('change');
		        	});
		        	$('select#basefield',container).trigger('change');
			    });
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
        var config=[];
        var relations={};
	    /* check values */
	    $.each($('div.block').first().find('div.relations'),function(index){
	        var container=$(this);
	        var values={};
	        var isTable=false;
		    if ($('select#basefield',container).val()=='')
		    {
		    	swal('Error!','基準フィールドを選択して下さい。','error');
		    	return;
		    }
		    isTable=vars.isTable[$('select#basefield',container).val()];
		    values['basefield']=$('select#basefield',container).val();
		    values['baseapp']=vars.appIds[$('select#basefield',container).val()];
		    values['baseappfield']=vars.appFields[$('select#basefield',container).val()];
		    values['istable']=(isTable)?'1':'0';
		    values['relations']={};
		    $.each($('tbody',container).find('tr'),function(index){
		        var row=$(this);
			    if ($('select#relationfield',row).val()=='')
			    {
			    	swal('Error!','表示フィールドを選択して下さい。','error');
			    	return;
			    }
			    if ($('select#basefield',container).val()==$('select#relationfield',row).val())
			    {
			    	swal('Error!','基準フィールドと表示フィールドは異なるフィールドを選択して下さい。','error');
			    	return;
			    }
			    if (vars.isTable[$('select#relationfield',container).val()]!=isTable)
			    {
			    	if (isTable) swal('Error!','基準フィールドをテーブル内のフィールドにした場合は、表示フィールドもテーブル内フィールドにして下さい。','error');
			    	else swal('Error!','基準フィールドがテーブル内のフィールドでない場合は、表示フィールドにテーブル内フィールドを指定出来ません。','error');
			    	return;
			    }
			    if ($('select#relationapp',row).val()=='')
			    {
			    	swal('Error!','関連付けるアプリとコピー元のフィールドを選択して下さい。','error');
			    	return;
			    }
			    if ($('select#relationappfield',row).val()=='')
			    {
			    	swal('Error!','関連付けるアプリとコピー元のフィールドを選択して下さい。','error');
			    	return;
			    }
			    if ($('select#basecode',row).val()=='')
			    {
			    	swal('Error!','フィールドの関連付けを選択して下さい。','error');
			    	return;
			    }
			    if ($('select#relationcode',row).val()=='')
			    {
			    	swal('Error!','フィールドの関連付けを選択して下さい。','error');
			    	return;
			    }
			    if ($('select#basefield',container).val()==$('select#relationfield',row).val())
			    {
			    	swal('Error!','基準フィールドと表示フィールドは異なるフィールドを選択して下さい。','error');
			    	return;
			    }
				values['relations'][index]={
					relationfield:$('select#relationfield',row).val(),
					relationapp:$('select#relationapp',row).val(),
					relationappfield:$('select#relationappfield',row).val(),
					basecode:$('select#basecode',row).val(),
					relationcode:$('select#relationcode',row).val(),
					lookup:($('select#relationfield',row).val() in vars.appIds)?'1':'0',
					rewrite:($('input#rewrite',row).prop('checked'))?'1':'0'
				};
			});
		    relations[index]=values;
	    });
		/* setup config */
        config['relations']=JSON.stringify(relations,'');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
    $('button#cancel').click(function(){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);