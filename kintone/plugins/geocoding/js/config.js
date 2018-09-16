/*
*--------------------------------------------------------------------
* jQuery-Plugin "geocoding -config.js-"
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
		colortable:null,
		excludeviewtable:null,
		informationtable:null,
		fieldinfos:{},
		condition:{
			form:null,
			fieldinfos:{}
		},
		colors:[],
		colorconditions:[]
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
							else $('select#spacer').append($('<option>').attr('value',values.elementId).text(values.elementId));
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
				}
			});
			return codes;
		},
		loadconditions:function(target,conditions){
			var row=null;
			target.clearrows();
			for (var i=0;i<conditions.length;i++)
			{
				var condition=conditions[i];
				target.addrow();
				row=target.rows.last();
				$('.field',row).text(vars.condition.fieldinfos[condition.field].label);
				$('.comp',row).text(condition.comp.name);
				$('.value',row).text(condition.label);
			}
			if (conditions.length>0) target.container.css({'display':'table'});
			else target.container.hide();
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.views,function(key,values){
			$('select#excludeview').append($('<option>').attr('value',values.id).text(key));
		});
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var config=kintone.plugin.app.getConfig(PLUGIN_ID);
				var fieldinfo=null;
				vars.fieldinfos=$.fieldparallelize(resp.properties);
				fieldinfo=$.grep(Object.values(resp.properties),function(item,index){return item.type=='RECORD_NUMBER'})[0];
				vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
				fieldinfo=$.grep(Object.values(resp.properties),function(item,index){return item.type=='MODIFIER'})[0];
				vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
				fieldinfo=$.grep(Object.values(resp.properties),function(item,index){return item.type=='CREATOR'})[0];
				vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
				fieldinfo=$.grep(Object.values(resp.properties),function(item,index){return item.type=='UPDATED_TIME'})[0];
				vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
				fieldinfo=$.grep(Object.values(resp.properties),function(item,index){return item.type=='CREATED_TIME'})[0];
				vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
				fieldinfo=$.grep(Object.values(resp.properties),function(item,index){return item.type=='STATUS'})[0];
				if (fieldinfo.enabled)
				{
					vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
					fieldinfo=$.grep(Object.values(resp.properties),function(item,index){return item.type=='STATUS_ASSIGNEE'})[0];
					vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
				}
				$.each(sorted,function(index){
					if (sorted[index] in vars.fieldinfos)
					{
						fieldinfo=vars.fieldinfos[sorted[index]];
						/* check field type */
						switch (fieldinfo.type)
						{
							case 'NUMBER':
								/* exclude lookup */
								if (!fieldinfo.lookup)
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
								if (!fieldinfo.lookup)
								{
									$('select#address').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									$('select#information').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
								break;
						}
						vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
					}
				});
				/* setup colorfields lists */
				vars.colors=[];
				$.each($.markercolors(),function(index,values){vars.colors.push('#'+values.back);});
				/* initialize valiable */
				vars.colortable=$('.colors').adjustabletable({
					add:'img.add',
					del:'img.del',
					addcallback:function(row){
						vars.colorconditions.push($('.kintoneplugin-table',row).adjustabletable());
						$('img.search',row).off('click').on('click',function(){
							var index=vars.colortable.rows.index(row);
							var conditions=($('input#conditions',row).val())?JSON.parse($('input#conditions',row).val()):[];
							vars.condition.form.show({fieldinfos:vars.condition.fieldinfos,conditions:conditions},function(resp){
								$('input#conditions',row).val(JSON.stringify(resp));
								functions.loadconditions(vars.colorconditions[index],resp);
							});
						});
						$('input#color',row).val(vars.colors[0].replace('#',''));
						$('span#color',row).colorSelector(vars.colors,$('input#color',row));
					},
					delcallback:function(index){
						vars.colorconditions.splice(index,1);
					}
				});
				vars.excludeviewtable=$('.excludeviews').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				vars.informationtable=$('.informations').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				var row=null;
				var colors=[];
				var excludeviews=[];
				var informations=[];
				if (Object.keys(config).length!==0)
				{
					if ('colors' in config) colors=JSON.parse(config['colors']);
					if ('excludeview' in config) excludeviews=JSON.parse(config['excludeview']);
					if ('information' in config) informations=JSON.parse(config['information']);
					$('select#address').val(config['address']);
					$('select#lat').val(config['lat']);
					$('select#lng').val(config['lng']);
					$('select#spacer').val(config['spacer']);
					$('input#mapheight').val(config['mapheight']);
					$('input#apikey').val(config['apikey']);
					if (config['map']=='1') $('input#map').prop('checked',true);
					if (config['usegeocoder']=='1') $('input#usegeocoder').prop('checked',true);
					for (var i=0;i<colors.length;i++)
					{
						if (i>0) vars.colortable.addrow();
						row=vars.colortable.rows.last();
						$('input#color',row).val(colors[i].color.replace('#',''));
						$('input#conditions',row).val(colors[i].conditions);
						$('span#color',row).colorSelector(vars.colors,$('input#color',row));
						functions.loadconditions(vars.colorconditions[i],JSON.parse(colors[i].conditions));
					}
					for (var i=0;i<excludeviews.length;i++)
					{
						if (i>0) vars.excludeviewtable.addrow();
						row=vars.excludeviewtable.rows.last();
						$('select#excludeview',row).val(excludeviews[i]);
					}
					for (var i=0;i<informations.length;i++)
					{
						if (i>0) vars.informationtable.addrow();
						row=vars.informationtable.rows.last();
						$('select#information',row).val(informations[i]);
					}
				}
				else $('input#mapheight').val('50');
				vars.condition.form=$('body').conditionsform({
					fields:vars.condition.fieldinfos
				});
			},function(error){swal('Error!',error.message,'error');});
		},function(error){swal('Error!',error.message,'error');});
	},function(error){swal('Error!',error.message,'error');});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var colors=[];
		var excludeviews=[];
		var informations=[];
		/* check values */
		if ($('select#address').val()=='')
		{
			swal('Error!','住所入力フィールドを選択して下さい。','error');
			return;
		}
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
		if ($('select#spacer').val()=='')
		{
			swal('Error!','地図表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#lat').val()==$('select#lng').val())
		{
			swal('Error!','緯度表示フィールドと経度表示フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('input#map').prop('checked'))
		{
			if ($('input#mapheight').val()=='') $('input#mapheight').val('50');
			if (!$.isNumeric($('input#mapheight').val()))
			{
				swal('Error!','一覧地図高さは数値を入力して下さい。','error');
				return;
			}
			for (var i=0;i<vars.colortable.rows.length;i++)
			{
				var color={
					color:'',
					conditions:'',
				};
				row=vars.colortable.rows.eq(i);
				if ($('input#color',row).val().length!=0)
				{
					color.color=$('input#color',row).val();
					color.conditions=($('input#conditions',row).val())?$('input#conditions',row).val():'[]';
					colors.push(color);
				}
			}
			if (colors.length==0)
			{
				swal('Error!','マーカー色を1つ以上指定して下さい。','error');
				return;
			}
			for (var i=0;i<vars.excludeviewtable.rows.length;i++)
			{
				row=vars.excludeviewtable.rows.eq(i);
				if ($('select#excludeview',row).val().length!=0) excludeviews.push($('select#excludeview',row).val());
			}
			for (var i=0;i<vars.informationtable.rows.length;i++)
			{
				row=vars.informationtable.rows.eq(i);
				if ($('select#information',row).val().length!=0) informations.push($('select#information',row).val());
			}
		}
		if ($('input#apikey').val()=='')
		{
			swal('Error!','Google Maps APIキーを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['address']=$('select#address').val();
		config['lat']=$('select#lat').val();
		config['lng']=$('select#lng').val();
		config['spacer']=$('select#spacer').val();
		config['map']=($('input#map').prop('checked'))?'1':'0';
		config['mapheight']=$('input#mapheight').val();
		config['usegeocoder']=($('input#usegeocoder').prop('checked'))?'1':'0';
		config['apikey']=$('input#apikey').val();
		config['colors']=JSON.stringify(colors);
		config['excludeview']=JSON.stringify(excludeviews);
		config['information']=JSON.stringify(informations);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);