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
		template:null,
		appIds:{},
		appFields:{},
		appNames:{},
		isTable:{},
		relations:[],
		offset:0,
		types:[
			'DATE',
			'DATETIME',
			'DROP_DOWN',
			'LINK',
			'MULTI_LINE_TEXT',
			'NUMBER',
			'RADIO_BUTTON',
			'RECORD_NUMBER',
			'SINGLE_LINE_TEXT',
			'SUBTABLE',
			'TIME'
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
		},
		loaddatas:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
					{
				    	$('select#relationapp').append($('<option>').attr('value',values.appId).text(values.name));
						vars.appNames[values.appId]=values.name;
					}
					vars.offset++;
				})
				if (resp.apps.length==100) functions.loaddatas(callback);
				else callback();
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	functions.loaddatas(function(){
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			/* setup field lists */
			$.each(resp.properties,function(key,values){
				if ($.inArray(values.type,vars.types)>-1)
				{
					switch (values.type)
					{
						case 'SUBTABLE':
							$.each(values.fields,function(key,values){
								if (values.lookup)
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
							if (values.lookup)
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
				var app='';
				var container=$(this).closest('div.relations');
				/* initialize field lists */
				$.each(container.find('select#basecode'),function(index){$(this).html('<option value=""></option>');});
				if ($(this).val().length!=0)
				{
					app=vars.appNames[vars.appIds[$(this).val()]];
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.appIds[$(this).val()]},function(resp){
						/* setup field lists */
						$.each(container.find('select#basecode'),function(index){
							var list=$(this);
							list.html('<option value=""></option>');
							$.each(resp.properties,function(key,values){
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
				}
			})
			$('select#relationapp').on('change',function(){
				var app='';
				var row=$(this).closest('tr');
				var listappfield=$('select#relationappfield',row);
				var listcode=$('select#relationcode',row);
				/* initialize field lists */
				listappfield.html('<option value=""></option>');
				listcode.html('<option value=""></option>');
				if ($(this).val().length!=0)
				{
					app=$(this).find('option:selected').text();
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:$(this).val()},function(resp){
						/* setup field lists */
						$.each(resp.properties,function(key,values){
							if ($.inArray(values.type,vars.types)>-1)
								if (values.type!='SUBTABLE')
								{
									listappfield.append($('<option>').attr('value',values.code).text(values.label));
									listcode.append($('<option>').attr('value',values.code).text('['+app+']'+values.label));
								}
						});
			        	if ($.hasData(listappfield[0]))
			        		if ($.data(listappfield[0],'initialdata').length!=0)
			        		{
			        			listappfield.val($.data(listappfield[0],'initialdata'));
			        			$.data(listappfield[0],'initialdata','');
			        		}
			        	if ($.hasData(listcode[0]))
			        		if ($.data(listcode[0],'initialdata').length!=0)
			        		{
			        			listcode.val($.data(listcode[0],'initialdata'));
			        			$.data(listcode[0],'initialdata','');
			        		}
					},function(error){});
				}
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
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
        var error=false;
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
		    	error=true;
		    	return false;
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
			    	error=true;
			    	return false;
			    }
			    if ($('select#basefield',container).val()==$('select#relationfield',row).val())
			    {
			    	swal('Error!','基準フィールドと表示フィールドは異なるフィールドを選択して下さい。','error');
			    	error=true;
			    	return false;
			    }
			    if (vars.isTable[$('select#relationfield',container).val()]!=isTable)
			    {
			    	if (isTable) swal('Error!','基準フィールドをテーブル内のフィールドにした場合は、表示フィールドもテーブル内フィールドにして下さい。','error');
			    	else swal('Error!','基準フィールドがテーブル内のフィールドでない場合は、表示フィールドにテーブル内フィールドを指定出来ません。','error');
			    	error=true;
			    	return false;
			    }
			    if ($('select#relationapp',row).val()=='')
			    {
			    	swal('Error!','関連付けるアプリとコピー元のフィールドを選択して下さい。','error');
			    	error=true;
			    	return false;
			    }
			    if ($('select#relationappfield',row).val()=='')
			    {
			    	swal('Error!','関連付けるアプリとコピー元のフィールドを選択して下さい。','error');
			    	error=true;
			    	return false;
			    }
			    if ($('select#basecode',row).val()=='')
			    {
			    	swal('Error!','フィールドの関連付けを選択して下さい。','error');
			    	error=true;
			    	return false;
			    }
			    if ($('select#relationcode',row).val()=='')
			    {
			    	swal('Error!','フィールドの関連付けを選択して下さい。','error');
			    	error=true;
			    	return false;
			    }
			    if ($('select#basefield',container).val()==$('select#relationfield',row).val())
			    {
			    	swal('Error!','基準フィールドと表示フィールドは異なるフィールドを選択して下さい。','error');
			    	error=true;
			    	return false;
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
			if (error) return false;
	    });
		if (error) return;
		/* setup config */
        config['relations']=JSON.stringify(relations,'');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
    $('button#cancel').on('click',function(e){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);