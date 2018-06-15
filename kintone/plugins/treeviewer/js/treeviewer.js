/*
*--------------------------------------------------------------------
* jQuery-Plugin "treeviewer"
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
  /*---------------------------------------------------------------
   valiable
  ---------------------------------------------------------------*/
  var vars={
    table:null,
    thumbnail:null,
    columns:[],
    excludefields:[],
    excludeviews:[],
    levels:[],
    config:{},
    fieldinfos:{}
  };
  var events={
    lists:[
      'app.record.index.show'
    ]
  };
  var limit=500;
  var functions={
    /* download file */
    download:function(fileKey){
      return new Promise(function(resolve,reject)
      {
        var url=kintone.api.url('/k/v1/file',true)+'?fileKey='+fileKey;
        var xhr=new XMLHttpRequest();
        xhr.open('GET',url);
        xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
        xhr.responseType='blob';
        xhr.onload=function(){
          if (xhr.status===200) resolve(xhr.response);
          else reject(Error('File download error:' + xhr.statusText));
        };
        xhr.onerror=function(){
          reject(Error('There was a network error.'));
        };
        xhr.send();
      });
    },
    /* check level field */
    islevel:function(code){
      return ($.grep(vars.levels,function(item,index){return item.code==code;}).length!=0);
    },
    /* check for completion of load */
    isloaded:function(){
      var loaded=0;
      var total=0;
      for (var i=0;i<vars.levels.length;i++)
      {
        loaded+=vars.levels[i].loaded;
        total++;
      }
      /* reload view */
      return (loaded==total);
    },
    /* reload view */
    load:function(){
      var head=$('<tr>');
      var template=$('<tr>');
      var levels={
        index:0,
        prev:1,
        total:1,
        values:[]
      };
      /* create level datas */
      for (var i=0;i<vars.levels.length;i++) levels.total*=vars.levels[i].records.length;
      for (var i=0;i<levels.total;i++) levels.values.push({});
      for (var i=0;i<vars.levels.length;i++)
      {
        var level=vars.levels[i];
        levels.index=0;
        for (var i2=0;i2<levels.prev;i2++)
          for (var i3=0;i3<level.records.length;i3++)
            for (var i4=0;i4<levels.total/levels.prev/level.records.length;i4++)
            {
              levels.values[levels.index][level.code]=level.records[i3];
              levels.index++;
            }
        levels.prev*=level.records.length;
      }
      /* append columns */
      for (var i=0;i<vars.columns.length;i++)
      {
        head.append(
          $('<th>')
          .css({'top':$('.gaia-header-toolbar').outerHeight(false).toString()+'px'})
          .append($('<div>').text(vars.columns[i].label))
        );
        if (i<vars.levels.length)
        {
          (function(column){
            template.append(
              $('<td id="'+vars.columns[column].code+'" class="treecell">')
              .append(
                $('<div>').on('click',function(){
                  var cell=$(this).closest('td');
                  var row=$(this).closest('tr');
                  var baserow=row;
                  var offset=0;
                  var records=[];
                  var setvalues=function(row,record){
                    var baserow=row;
                    var tables=[];
                    $.each(record,function(key,values){
                      if (!functions.islevel(key))
                        switch (values.type)
                        {
                          case 'SUBTABLE':
                            for (var i=0;i<values.value.length;i++)
                            {
                              if (tables.length<i) tables.push({});
                              $.each(values.value[i].value,function(key,values){
                                if (i==0)
                                {
                                  if (!key.match(/^\$/g))
                                    if ($('#'+key,row)) functions.setvalue($('div',$('#'+key,row)),vars.fieldinfos[key],values.value);
                                }
                                else tables[i-1][key]=values;
                              });
                            }
                            break;
                          default:
                            if (!key.match(/^\$/g))
                              if ($('#'+key,row)) functions.setvalue($('div',$('#'+key,row)),vars.fieldinfos[key],values.value);
                            break;
                        }
                    });
                    for (var i=0;i<tables.length;i++)
                      vars.table.insertrow(baserow,function(row){
                        functions.setrowspan(row,function(){
                          baserow=setvalues(row,tables[i]);
                        });
                      });
                    if ('$id' in record) $('input',$('.buttoncell',row)).val(record['$id'].value);
                    else $('button',$('.buttoncell',row)).hide();
                    return baserow;
                  };
                  if ($(this).hasClass('open'))
                  {
                    functions.treeclose(row,column,cell);
                    $(this).removeClass('open');
                  }
                  else
                  {
                    switch (column)
                    {
                      case (vars.levels.length-1):
                        if (!$.data(cell[0],'added'))
                        {
                          functions.loaddatas(row,records,offset,function(records){
                            for (var i=0;i<records.length;i++)
                            {
                              var record=records[i];
                              if (i==0) setvalues(row,record);
                              else
                              {
                                vars.table.insertrow(baserow,function(row){
                                  functions.setrowspan(row,function(){
                                    baserow=setvalues(row,record);
                                  });
                                });
                              }
                            }
                            functions.treeopen(row,column,cell);
                            $.data(cell[0],'added',true);
                          });
                        }
                        else functions.treeopen(row,column,cell);
                        break;
                      default:
                        functions.treeopen(row,column,cell);
                        break;
                    }
                    $(this).addClass('open');
                  }
                })
              )
              .append($('<input type="hidden" value="">'))
            );
          })(i);
        }
        else template.append($('<td id="'+vars.columns[i].code+'" class="datacell">').append($('<div>')));
      }
      /* append button column */
      head.append(
        $('<th>')
        .css({'top':$('.gaia-header-toolbar').outerHeight(false).toString()+'px'})
        .append($('<div>').text(''))
      );
      template.append($('<td class="buttoncell">')
        .append($('<button class="customview-button edit-button">').on('click',function(){
          var cell=$(this).closest('td');
          var index=$('input',cell).val();
          var url='';
          if (index.length!=0)
          {
            url='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+index;
            if (vars.config['windowopen']==1) window.open(url);
            else window.location.href=url;
          }
        }))
        .append($('<input type="hidden" value="">'))
      );
      /* create table */
      vars.table=$('<table class="treeviewer-table">').mergetable({
        container:$('div#view-list-data-gaia').empty(),
        head:head,
        template:template,
        merge:false
      });
      /* place the level data */
      for (var i=0;i<levels.values.length;i++)
        vars.table.insertrow(null,function(row){
          $.each(levels.values[i],function(key,values){
            $('input',$('#'+key,row)).val(values.field);
            $('div',$('#'+key,row)).text(values.display);
          });
        });
      /* merge row */
      var mergeinfos=[];
      for (var i=0;i<vars.levels.length;i++) mergeinfos.push({cache:'',cell:null,index:-1,span:0});
      $.each(vars.table.rows,function(index){
        var row=vars.table.rows.eq(index);
        for (var i=0;i<vars.levels.length;i++)
        {
          var cell=$('.treecell',row).eq(i);
          if (mergeinfos[i].cache!=$('input',cell).val())
          {
            if (mergeinfos[i].index!=-1)
            {
              mergeinfos[i].cell.attr('rowspan',mergeinfos[i].span);
              $.data(mergeinfos[i].cell[0],'rowspan',mergeinfos[i].span);
              for (var i2=mergeinfos[i].index+1;i2<index;i2++) $('.treecell',vars.table.rows.eq(i2)).eq(i).addClass('disusedcell');
            }
            mergeinfos[i].cache=$('input',cell).val();
            mergeinfos[i].cell=cell;
            mergeinfos[i].index=index;
            mergeinfos[i].span=0;
            for (var i2=i+1;i2<vars.levels.length;i2++)
            {
              cell=$('.treecell',row).eq(i2);
              if (mergeinfos[i2].index!=-1)
              {
                mergeinfos[i2].cell.attr('rowspan',mergeinfos[i2].span);
                $.data(mergeinfos[i2].cell[0],'rowspan',mergeinfos[i2].span);
                for (var i3=mergeinfos[i2].index+1;i3<index;i3++) $('.treecell',vars.table.rows.eq(i3)).eq(i2).addClass('disusedcell');
              }
              mergeinfos[i2].cache=$('input',cell).val();
              mergeinfos[i2].cell=cell;
              mergeinfos[i2].index=index;
              mergeinfos[i2].span=0;
            }
          }
          mergeinfos[i].span++;
        }
      });
      var index=vars.table.rows.length-1;
      var row=vars.table.rows.last();
      for (var i=0;i<vars.levels.length;i++)
      {
        var cell=$('.treecell',row).eq(i);
        if (mergeinfos[i].cache==$('input',cell).val() && mergeinfos[i].index!=index)
        {
          mergeinfos[i].cell.attr('rowspan',mergeinfos[i].span);
          $.data(mergeinfos[i].cell[0],'rowspan',mergeinfos[i].span);
          for (var i2=mergeinfos[i].index+1;i2<index+1;i2++) $('.treecell',vars.table.rows.eq(i2)).eq(i).addClass('disusedcell');
        }
        else
        {
          mergeinfos[i].cell.attr('rowspan',1);
          $.data(mergeinfos[i].cell[0],'rowspan',1);
        }
      }
      /* tree close */
      $.each(vars.table.rows,function(index){
        (function(row){
          if (!$('.treecell',row).eq(0).hasClass('disusedcell')) functions.treeclose(row,0,$('.treecell',row).eq(0));
        })(vars.table.rows.eq(index));
      });
      /* append elements */
      $('.gaia-argoui-app-index-pager').hide();
      vars.thumbnail=$('<div class="imageviewer">').css({
        'background-color':'rgba(0,0,0,0.5)',
        'display':'none',
        'height':'100%',
        'left':'0px',
        'position':'fixed',
        'top':'0px',
        'width':'100%',
        'z-index':'999999'
      })
      .append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png">').css({
        'cursor':'pointer',
        'display':'block',
        'height':'30px',
        'margin':'0px',
        'padding':'0px',
        'position':'absolute',
        'right':'5px',
        'top':'5px',
        'width':'30px'
      }))
      .append($('<img class="listviewer-image">').css({
        'bottom':'0',
        'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
        'display':'block',
        'height':'auto',
        'left':'0',
        'margin':'auto',
        'max-height':'calc(100% - 80px)',
        'max-width':'calc(100% - 80px)',
        'padding':'0px',
        'position':'absolute',
        'right':'0',
        'top':'0',
        'width':'auto'
      }))
      .on('click',function(){vars.thumbnail.hide();});
      $('body').append(vars.thumbnail);
    },
    /* reload datas */
    loaddatas:function(row,records,offset,callback){
      var sort='';
      var query=kintone.app.getQueryCondition();
      var body={
        app:kintone.app.getId(),
        query:''
      };
      $.each($('.treecell',row),function(index){
        var cell=$('.treecell',row).eq(index);
        query+=((query.length!=0)?' and ':'');
        switch (vars.fieldinfos[cell.attr('id')].type)
        {
          case 'DROP_DOWN':
          case 'RADIO_BUTTON':
            query+=cell.attr('id')+' in ("'+$('input',cell).val()+'")';
            break;
          case 'NUMBER':
            query+=cell.attr('id')+'='+$('input',cell).val();
            break;
          default:
            query+=cell.attr('id')+'="'+$('input',cell).val()+'"';
            break;
        }
      });
      sort=' order by $id asc limit '+limit.toString()+' offset '+offset.toString();
      body.query+=query+sort;
      kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
        Array.prototype.push.apply(records,resp.records);
        offset+=limit;
        if (resp.records.length==limit) functions.loaddatas(row,records,offset,callback);
        else callback(records);
      },function(error){});
    },
    /* reload datas of level */
    loadlevels:function(param,callback){
      var body={
        app:param.app,
        query:vars.fieldinfos[param.code].lookup.filterCond+' order by '+param.field+' '+param.sort+' limit '+limit.toString()+' offset '+param.offset.toString()
      };
      kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
        var records=[]
        $.each(resp.records,function(index,values){
          records.push({display:values[param.display].value,field:values[param.field].value});
        });
        Array.prototype.push.apply(param.records,records);
        param.offset+=limit;
        if (resp.records.length==limit) functions.loadlevels(param,callback);
        else
        {
          param.loaded=1;
          callback(param);
        }
      },function(error){});
    },
    /* setup rowspan */
    setrowspan:function(row,callback){
      var index=vars.table.rows.index(row);
      for (var i=0;i<vars.levels.length;i++)
        for (var i2=index-1;i2>-1;i2--)
        {
          var cell=$('.treecell',vars.table.rows.eq(i2)).eq(i);
          if (!cell.hasClass('disusedcell'))
          {
            cell.attr('rowspan',$.data(cell[0],'rowspan')+1);
            $.data(cell[0],'rowspan',$.data(cell[0],'rowspan')+1);
            break;
          }
        }
      $('.treecell',row).addClass('disusedcell');
      if (callback) callback();
    },
    /* setup value */
    setvalue:function(cell,fieldinfo,values){
      var value=null;
      var unit=(fieldinfo.unit!=null)?fieldinfo.unit:'';
      var unitPosition=(fieldinfo.unitPosition!=null)?fieldinfo.unitPosition.toUpperCase():'BEFORE';
      if (values!=null)
        switch (fieldinfo.type.toUpperCase())
        {
          case 'CALC':
            if (values.length!=0)
            {
              switch(fieldinfo.format.toUpperCase())
              {
                case 'NUMBER':
                  value=values;
                  break;
                case 'NUMBER_DIGIT':
                  value=parseFloat(values).format();
                  break;
                case 'DATETIME':
                  value=new Date(values.dateformat());
                  value=value.format('Y-m-d H:i');
                  break;
                case 'DATE':
                  value=new Date((values+'T00:00:00+09:00').dateformat());
                  value=value.format('Y-m-d');
                  break;
                case 'TIME':
                  value=new Date(('1900-01-01T'+values+':00+09:00').dateformat());
                  value=value.format('H:i');
                  break;
                case 'HOUR_MINUTE':
                  value=values;
                  break;
                case 'DAY_HOUR_MINUTE':
                  value=values;
                  break;
              }
              if (unitPosition=='BEFORE') value=unit+value;
              else value=value+unit;
              cell.text(value);
            }
            break;
          case 'CATEGORY':
          case 'CHECK_BOX':
          case 'MULTI_SELECT':
            if (values.length!=0)
            {
              value=values.join('<br>');
              cell.html(value);
            }
            break;
          case 'CREATOR':
          case 'MODIFIER':
            if (values.code.length!=0) cell.html('<a href="https://'+$(location).attr('host')+'/k/#/people/user/'+values.code+'" target="_blank">'+values.name+'</a>');
            break;
          case 'CREATED_TIME':
          case 'DATETIME':
          case 'UPDATED_TIME':
            if (values.length!=0)
            {
              value=new Date(values.dateformat());
              cell.text(value.format('Y-m-d H:i'));
            }
            break;
          case 'DATE':
            if (values.length!=0)
            {
              value=new Date((values+'T00:00:00+09:00').dateformat());
              cell.text(value.format('Y-m-d'));
            }
            break;
          case 'FILE':
            if (values.length!=0)
            {
              value=[];
              $.each(values,function(index){
                switch(values[index].contentType)
                {
                  case 'image/bmp':
                  case 'image/gif':
                  case 'image/jpeg':
                  case 'image/png':
                    value.push($('<img src="" class="listviewer-thumbnail" alt="'+values[index].name+'" title="'+values[index].name+'" />')
                      .on('click',function(e){
                        vars.thumbnail.find('.listviewer-image').attr('src',$(this).attr('src'));
                        vars.thumbnail.show();
                      })
                    );
                    functions.download(values[index].fileKey).then(function(blob){
                      var url=window.URL || window.webkitURL;
                      var image=url.createObjectURL(blob);
                      value[index].attr('src',url.createObjectURL(blob));
                    });
                    break;
                  default:
                    value.push($('<a href="./">'+values[index].name+'</a>')
                      .on('click',function(e){
                        functions.download(values[index].fileKey).then(function(blob){
                          var url=window.URL || window.webkitURL;
                          var a=document.createElement('a');
                          a.setAttribute('href',url.createObjectURL(blob));
                          a.setAttribute('target','_blank');
                          a.setAttribute('download',values[index].name);
                          a.style.display='none';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        });
                        return false;
                      })
                    );
                    break;
                }
              });
              $.each(value,function(index){cell.append(value[index]);});
            }
            break;
          case 'LINK':
            if (values.length!=0)
            {
              switch(fieldinfo.protocol.toUpperCase())
              {
                case 'CALL':
                  value='<a href="tel:'+values+'" target="_blank">'+values+'</a>';
                  break;
                case 'MAIL':
                  value='<a href="mailto:'+values+'" target="_blank">'+values+'</a>';
                  break;
                case 'WEB':
                  value='<a href="'+values+'" target="_blank">'+values+'</a>';
                  break;
              }
              cell.html(value);
            }
            break;
          case 'MULTI_LINE_TEXT':
            if (values.length!=0) cell.html(values.replace(/\n/g,'<br>'));
            break;
          case 'NUMBER':
            if (values.length!=0)
            {
              if (fieldinfo.digit) value=parseFloat(values).format();
              else value=values;
              if (unitPosition=='BEFORE') value=unit+value;
              else value=value+unit;
              cell.text(value);
            }
            break;
          case 'GROUP_SELECT':
          case 'ORGANIZATION_SELECT':
            if (values.length!=0)
            {
              value='';
              $.each(values,function(index){
                value+='<span>'+values[index].name+'</span>';
              });
              cell.html(value);
            }
            break;
          case 'RICH_TEXT':
            if (values.length!=0) cell.html(values);
            break;
          case 'STATUS_ASSIGNEE':
          case 'USER_SELECT':
            if (values.length!=0)
            {
              value='';
              $.each(values,function(index){
                value+='<a href="https://'+$(location).attr('host')+'/k/#/people/user/'+values[index].code+'" target="_blank">'+values[index].name+'</a>';
              });
              cell.html(value);
            }
            break;
          case 'TIME':
            if (values.length!=0)
            {
              value=new Date(('1900-01-01T'+values+':00+09:00').dateformat());
              cell.text(value.format('H:i'));
            }
            break;
          default:
            if (values.length!=0) cell.text(values);
            break;
        }
    },
    /* tree actions */
    treeopen:function(row,column,cell){
      var index=vars.table.rows.index(row);
      var span=$.data(cell[0],'rowspan');
      if (column==vars.levels.length-1)
      {
        if ($('input',$('.buttoncell',row)).val().length!=0) $('.datacell,.buttoncell',row).removeClass('empty hide');
        for (var i=index+1;i<index+span;i++) $('.datacell,.buttoncell',vars.table.rows.eq(i)).removeClass('hide');
      }
      else
      {
        $('.treecell',row).eq(column+1).removeClass('empty hide');
        for (var i2=index;i2<index+span;i2++)
        {
          (function(row){
            if (!$('.treecell',row).eq(column+1).hasClass('disusedcell')) $('.treecell',row).eq(column+1).removeClass('hide');
            if ($('div',$('.treecell',row).eq(column+1)).hasClass('open'))
              functions.treeopen(row,column+1,$('.treecell',row).eq(column+1));
          })(vars.table.rows.eq(i2));
        }
      }
      cell.attr('rowspan',span);
    },
    treeclose:function(row,column,cell){
      var index=vars.table.rows.index(row);
      var span=$.data(cell[0],'rowspan');
      $('.datacell,.buttoncell',row).addClass('empty');
      for (var i=index+1;i<index+span;i++) $('.datacell,.buttoncell',vars.table.rows.eq(i)).addClass('hide');
      for (var i=column+1;i<vars.levels.length;i++)
      {
        $('.treecell',row).eq(i).addClass('empty');
        for (var i2=index+1;i2<index+span;i2++)
        {
          (function(row){
            if (!$('.treecell',row).eq(i).hasClass('disusedcell')) $('.treecell',row).eq(i).addClass('hide');
          })(vars.table.rows.eq(i2));
        }
        $('.treecell',row).eq(i).attr('rowspan',1);
      }
      cell.attr('rowspan',1);
    }
  };
  /*---------------------------------------------------------------
   kintone events
  ---------------------------------------------------------------*/
  kintone.events.on(events.lists,function(event){
    vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!vars.config) return event;
    if ('excludefield' in vars.config) vars.excludefields=JSON.parse(vars.config.excludefield);
    if ('excludeview' in vars.config) vars.excludeviews=JSON.parse(vars.config.excludeview);
    if ('level' in vars.config) vars.levels=JSON.parse(vars.config.level);
    /* check viewid */
    if ($.inArray(event.viewId.toString(),vars.excludeviews)>-1) return event;
    /* fixed header */
    var headeractions=$('div.contents-actionmenu-gaia');
    var headerspace=$(kintone.app.getHeaderSpaceElement());
    headeractions.parent().css({'position':'relative'});
    headerspace.parent().css({'position':'relative'});
    $(window).on('load resize scroll',function(e){
      headeractions.css({
        'left':$(window).scrollLeft().toString()+'px',
        'position':'absolute',
        'top':'0px',
        'width':$(window).width().toString()+'px'
      });
      headerspace.css({
        'left':$(window).scrollLeft().toString()+'px',
        'position':'absolute',
        'top':headeractions.outerHeight(false)+'px',
        'width':$(window).width().toString()+'px'
      });
      $('div#view-list-data-gaia').css({'margin-top':(headeractions.outerHeight(false)+headerspace.outerHeight(false))+'px','overflow-x':'visible'});
    });
    /* get views of app */
    kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
      $.each(resp.views,function(key,values){
        if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
        {
          /* get layout of app */
          kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
            var tablelayout={};
            (function(layouts){
              for (var i=0;i<layouts.length;i++)
              {
                var layout=layouts[i];
                if (layout.type=='SUBTABLE')
                {
                  var fields=[];
                  for (var i2=0;i2<layout.fields.length;i2++)
                  {
                    var fieldinfo=layout.fields[i2];
                    /* exclude spacer */
                    if ($.inArray(fieldinfo.code,vars.excludefields)<0 && !fieldinfo.elementId) fields.push(fieldinfo.code);
                  }
                  tablelayout[layout.code]=fields;
                }
              }
            })(resp.layout);
            /* get fields of app */
            kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
              vars.fieldinfos=resp.properties;
              /* append level columns */
              for (var i=0;i<vars.levels.length;i++) vars.columns.push(vars.fieldinfos[vars.levels[i].code]);
              /* append columns */
              for (var i=0;i<values.fields.length;i++)
              {
                var fieldinfo=vars.fieldinfos[values.fields[i]];
                if (fieldinfo.code in tablelayout)
                {
                  for (var i2=0;i2<tablelayout[fieldinfo.code].length;i2++) vars.columns.push(fieldinfo.fields[tablelayout[fieldinfo.code][i2]]);
                }
                else
                {
                  if (!functions.islevel(fieldinfo.code)) vars.columns.push(fieldinfo);
                }
              }
              /* initialize valiable */
              vars.fieldinfos=$.fieldparallelize(vars.fieldinfos);
              /* setup level */
              for (var i=0;i<vars.levels.length;i++)
              {
                var param=vars.levels[i];
                param.loaded=0;
                param.offset=0;
                param.records=[];
                if (param.app.length!=0) functions.loadlevels(param,function(res){if (functions.isloaded()) functions.load();});
                else
                {
                  param.records=[vars.fieldinfos[param.code].options.length];
                  $.each(vars.fieldinfos[param.code].options,function(key,values){
                    param.records[values.index]={display:values.label,field:values.label};
                  });
                  param.loaded=1;
                }
              }
              if (functions.isloaded()) functions.load();
            },function(error){});
          },function(error){});
        }
      })
    });
    return;
  });
})(jQuery,kintone.$PLUGIN_ID);
