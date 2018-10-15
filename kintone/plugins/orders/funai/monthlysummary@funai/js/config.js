/*
*--------------------------------------------------------------------
* jQuery-Plugin "monthlysummary -config.js-"
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
		fieldinfos:{},
		condition:{
			form:null,
			fieldinfos:{}
		},
		views:{
			table:null,
			summaryinfos:[]
		},
		colors:[
			'#FA8273',
			'#FFF07D',
			'#7DC87D',
			'#69B4C8',
			'#827DB9',
			'#E16EA5',
			'#FA7382',
			'#FFB46E',
			'#B4DC69',
			'#64C3AF',
			'#69A0C8',
			'#B473B4',
			'#FFFFFF',
			'#D6D1CC',
			'#989898',
			'#333333'
		]
	};
	var functions={
		denominatoradd:function(rows){
			var captions=[];
			for (var i=0;i<rows.length-1;i++)
			{
				$('select#denominator',rows.eq(i)).append($('<option>').attr('value',rows.length-1).text(''));
				$('select#denominator',rows.eq(rows.length-1)).append($('<option>').attr('value',i).text($('input#caption',rows.eq(i)).val()));
			}
			$('select#denominator',rows.eq(rows.length-1)).append($('<option>').attr('value',rows.length-1).text(''));
		},
		denominatordelete:function(rows,index){
			for (var i=0;i<rows.length;i++)
			{
				var denominator=$('select#denominator',rows.eq(i));
				var value=denominator.val();
				if ($.isNumeric(value))
				{
					if (parseInt(value)==index) value='';
					if (parseInt(value)>index) value=(parseInt(value)-1).toString();
				}
				$('option',denominator).eq(index+1).remove();
				for (var i2=index;i2<$('option',denominator).length;i2++) $('option',denominator).eq(i2).attr('value',i2-1);
				denominator.val(value);
			}
		},
		denominatorupdate:function(rows,index,caption){
			for (var i=0;i<rows.length;i++) $('select#denominator option',rows.eq(i)).eq(index+1).text(caption);
		},
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
			$('select#view').append($('<option>').attr('value',values.id).text(key));
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
							case 'CALC':
								switch (fieldinfo.format)
								{
									case 'NUMBER':
									case 'NUMBER_DIGIT':
										if (fieldinfo.tablecode) $('select#field').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
								}
								break;
							case 'DATE':
							case 'DATETIME':
								if (fieldinfo.tablecode) $('select#date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
							case 'NUMBER':
								if (fieldinfo.tablecode) $('select#field').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
						}
						vars.condition.fieldinfos[fieldinfo.code]=fieldinfo;
					}
				});
				/* initialize valiable */
				vars.views.table=$('.outer').adjustabletable({
					add:'img.add',
					del:'img.del',
					addcallback:function(row){
						var summaryinfo={
							table:null,
							conditions:[]
						};
						summaryinfo.table=$('.inner',row).adjustabletable({
							add:'img.addsummary',
							del:'img.delsummary',
							addcallback:function(row){
								summaryinfo.conditions.push($('.kintoneplugin-table',row).adjustabletable());
								$('img.search',row).off('click').on('click',function(){
									var index=summaryinfo.table.rows.index(row);
									var conditions=($('input#conditions',row).val())?JSON.parse($('input#conditions',row).val()):[];
									vars.condition.form.show({fieldinfos:vars.condition.fieldinfos,conditions:conditions},function(resp){
										$('input#conditions',row).val(JSON.stringify(resp));
										functions.loadconditions(summaryinfo.conditions[index],resp);
									});
								});
								$('input#caption',row).off('change').on('change',function(){
									functions.denominatorupdate(summaryinfo.table.rows,summaryinfo.table.rows.index(row),$(this).val());
								});
								$('select#pattern',row).off('change').on('change',function(){
									switch ($(this).val())
									{
										case '3':
										case '9':
											$('select#denominator',row).closest('.kintoneplugin-select-outer').show();
											break;
										default:
											$('select#denominator',row).closest('.kintoneplugin-select-outer').hide();
											break;
									}
									switch ($(this).val())
									{
										case '0':
										case '1':
										case '2':
										case '3':
										case '4':
										case '5':
											$('select#field',row).closest('.kintoneplugin-select-outer').show();
											break;
										default:
											$('select#field',row).closest('.kintoneplugin-select-outer').hide();
											break;
									}
								});
								$('input#backcolor',row).val(vars.colors[12].replace('#',''));
								$('input#forecolor',row).val(vars.colors[15].replace('#',''));
								$('span#backcolor',row).colorSelector(vars.colors,$('input#backcolor',row));
								$('span#forecolor',row).colorSelector(vars.colors,$('input#forecolor',row));
								if (summaryinfo.table) functions.denominatoradd(summaryinfo.table.rows);
							},
							delcallback:function(index){
								functions.denominatordelete(summaryinfo.table.rows,index);
								summaryinfo.conditions.splice(index,1);
							}
						});
						functions.denominatoradd(summaryinfo.table.rows);
						vars.views.summaryinfos.push(summaryinfo);
					},
					delcallback:function(index){
						vars.views.summaryinfos.splice(index,1);
					}
				});
				var index=0;
				var row=null;
				var views={};
				if (Object.keys(config).length!==0)
				{
					views=JSON.parse(config['views']);
					$('select#round').val(config['round']);
					$('input#digit').val(config['digit']);
					$('input#basemonth').val(config['basemonth']);
					for (var key in views)
					{
						if (index>0) vars.views.table.addrow();
						$('select#view',vars.views.table.rows.last()).val(key.replace(/^_/g,''));
						for (var i=0;i<views[key].length;i++)
						{
							if (i>0) vars.views.summaryinfos[index].table.addrow();
							row=vars.views.summaryinfos[index].table.rows.last();
							$('select#pattern',row).val(views[key][i].pattern);
							$('select#date',row).val(views[key][i].date);
							$('select#field',row).val(views[key][i].field);
							$('input#caption',row).val(views[key][i].caption);
							$('input#conditions',row).val(views[key][i].conditions);
							functions.loadconditions(vars.views.summaryinfos[index].conditions[i],JSON.parse(views[key][i].conditions));
							switch (views[key][i].pattern)
							{
								case '3':
								case '9':
									$('select#denominator',row).closest('.kintoneplugin-select-outer').show();
									break;
								default:
									$('select#denominator',row).closest('.kintoneplugin-select-outer').hide();
									break;
							}
							switch (views[key][i].pattern)
							{
								case '0':
								case '1':
								case '2':
								case '3':
								case '4':
								case '5':
									$('select#field',row).closest('.kintoneplugin-select-outer').show();
									break;
								default:
									$('select#field',row).closest('.kintoneplugin-select-outer').hide();
									break;
							}
							$('input#backcolor',row).val(views[key][i].backcolor.replace('#',''));
							$('input#forecolor',row).val(views[key][i].forecolor.replace('#',''));
							$('span#backcolor',row).colorSelector(vars.colors,$('input#backcolor',row));
							$('span#forecolor',row).colorSelector(vars.colors,$('input#forecolor',row));
						}
						for (var i=0;i<views[key].length;i++)
						{
							functions.denominatorupdate(vars.views.summaryinfos[index].table.rows,i,views[key][i].caption);
							$('select#denominator',vars.views.summaryinfos[index].table.rows.eq(i)).val(views[key][i].denominator);
						}
						index++;
					}
				}
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
		var key='';
		var row=null;
		var config=[];
		var views={};
		/* check values */
		for (var i=0;i<vars.views.table.rows.length;i++)
		{
			row=vars.views.table.rows.eq(i);
			if (!$('select#view',row).val()) continue;
			else
			{
				key='_'+$('select#view',row).val();
				views[key]=[];
			}
			for (var i2=0;i2<vars.views.summaryinfos[i].table.rows.length;i2++)
			{
				var summary={
					pattern:'',
					caption:'',
					denominator:'',
					date:'',
					field:'',
					conditions:'',
					backcolor:'',
					forecolor:''
				};
				row=vars.views.summaryinfos[i].table.rows.eq(i2);
				if (!$('select#pattern',row).val()) continue;
				else summary.pattern=$('select#pattern',row).val();
				if ($('input#caption',row).val()=='')
				{
					swal('Error!','見出しを入力して下さい。','error');
					return;
				}
				else summary.caption=$('input#caption',row).val();
				switch (summary.pattern)
				{
					case '3':
					case '9':
						if ($('select#denominator',row).val()=='')
						{
							swal('Error!','分母となる集計を選択して下さい。','error');
							return;
						}
						break;
				}
				if ($('select#date',row).val()=='')
				{
					swal('Error!','集計基準日付フィールドを選択して下さい。','error');
					return;
				}
				switch (summary.pattern)
				{
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
						if ($('select#field',row).val()=='')
						{
							swal('Error!','集計フィールドを選択して下さい。','error');
							return;
						}
						if (vars.fieldinfos[$('select#date',row).val()].tablecode!=vars.fieldinfos[$('select#field',row).val()].tablecode)
						{
							swal('Error!','集計基準日付フィールドと集計フィールドの指定は同一テーブルにして下さい。','error');
							return;
						}
						break;
				}
				summary.denominator=$('select#denominator',row).val();
				summary.date=$('select#date',row).val();
				summary.field=$('select#field',row).val();
				summary.conditions=($('input#conditions',row).val())?$('input#conditions',row).val():'[]';
				summary.backcolor=$('input#backcolor',row).val();
				summary.forecolor=$('input#forecolor',row).val();
				views[key].push(summary);
			}
			if (views[key].length==0)
			{
				swal('Error!','集計設定を指定して下さい。','error');
				return;
			}
		}
		if (Object.keys(views).length==0)
		{
			swal('Error!','集計設定をして下さい。','error');
			return;
		}
		/* setup config */
		config['round']=$('select#round').val();
		config['digit']=(($('input#digit').val().match(/^[0-9]+$/g))?$('input#digit').val():'0');
		config['basemonth']=(($('input#basemonth').val().match(/^([1-9]{1}|1[1-2]{1})+$/g))?$('input#basemonth').val():'1');
		config['views']=JSON.stringify(views);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);