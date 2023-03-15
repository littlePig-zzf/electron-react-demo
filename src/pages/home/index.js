import React, { useEffect, useState } from 'react';
import { Card, Button, Upload, List, message, Space } from 'antd';
import HomeStyled from './styled';
import { UploadOutlined } from '@ant-design/icons';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import classnames from 'classnames';
import * as XLSX from 'xlsx';

const cardArr = ['srt转txt','处理剪映导出的txt文件换行','导入xlsx表格批量下载视频']
const cardTxt = ['选择srt文件夹','选择txt文件夹','选择xlsx表格']
const Home = () => {
  const [files, setFiles] = useState([])
  const [copied, setCopied] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [xlsxList, setXlsxList] = useState([])

  const transferFile = (file)=>{
    switch (currentCard) {
      case 0:
        srtToTxt(file)
        break;
      case 1:
        transferTxt(file)
        break;
      default:
        handleXlsx(file)
        break;
    }
  }

  const srtToTxt = (file) => {
    console.log(file);
    const res = file?.name.split('.')
    if (res[1] !== 'srt') return
    if (window.FileReader) {  
      var reader = new FileReader(); 
      reader.onload = function(res) {  
          const data = res.target.result
          let result = data.split(/\n\s\n/).filter(citem => citem !== "").map((ccitem) => {
            let textItem = ccitem.split(/\n/);
            return  textItem[2]?.replace('\r', '')
          })
          result = result.join(',') 
          files.push({data:result, name: file?.name})
          setFiles([...files])
      }  
      reader.readAsText(file);  
    }
  }

  const transferTxt = (file) => {
    const res = file?.name.split('.')
    if (res[1] !== 'txt') return
    let result = ''
    if (window.FileReader) {  
      var reader = new FileReader(); 
      reader.onload = function(res) {  
        const data = res.target.result
        result = data.split(/\r\n/)?.join(', ')
        files.push({data:result, name: file?.name})
        setFiles([...files])
      }  
      reader.readAsText(file);  
    }
  }

  const handleXlsx = (file) => {
    if (!file) {
      return false
    } else if (!/\.(xls|xlsx)$/.test(file.name.toLowerCase())) {
      // 这里格式根据自己需求定义
      message.error('格式错误，请上传xls或者xlsx格式')
      return false
    }
    if (window.FileReader) {  
      var reader = new FileReader(); 
      reader.onload = function(ev) {  
        try {
          const data = ev.target.result
          const workbook = XLSX.read(data, {
            // 以字符编码方式解析
            type: 'binary'
          })
          workbook.SheetNames?.forEach((item, index) => {
            window.fs.mkdir(`./video/${item}`, function (err) {
              if (!err) {
                  console.log('创建目标文件夹成功 🎉');
              }
          })
            const exl = XLSX.utils.sheet_to_json(workbook.Sheets[item]) // 生成json表格内容
            // 将 JSON 数据挂到 data 里
            let arr = []
            exl.forEach(item => {
              !item['内容文案'] && item['文案来源视频'] && arr.push({title: item['来源账号'],url: item['文案来源视频'], status: ''})
            })
           
            xlsxList.push({name: item, data: arr})
            setXlsxList([...xlsxList])
            setTimeout(()=>{
              console.log(xlsxList, 'list');
              arr.forEach((cItem, cIndex)=>{
                downloadXlsx(item, cItem, index, cIndex)
              })
            },0)
          })
        } catch (e) {
          return false
        }
      }
      reader.readAsBinaryString(file)
    }
  }

  const addCard = (index) => {
    setCurrentCard(index)
    setFiles([])
  }

  const downloadXlsx = (name, cItem, index, cIndex)=> {
      if (!cItem.url) return
      const filePath = `./video/${name}/${cItem.title}.mp4`; // 本地保存的文件名和路径
    
      const file = window.fs.createWriteStream(filePath);
      window.https.get(cItem.url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close();
          xlsxList[index].data[cIndex].status = 'success'
          setXlsxList([...xlsxList])
          console.log('视频文件下载完成');
        });
      }).on('error', (err) => {
        console.log("💢 Error: ", err.message);
    });
  }

  useEffect(()=>{
    if (copied) {
      message.success('复制成功')
      setCopied(false)
    }
  }, [copied])
  console.log(__dirname, '=======name');
  return (
    <HomeStyled>
      <div className='wrap'>
        { cardArr?.map((item, index) => 
          <Card className={classnames({'card': true, 'active':currentCard === index})} onClick={e=>addCard(index)}>
            <p>{item}</p>
          </Card>
        )}
      </div>
      <div className='content'>
        <Space>
          {currentCard !== 2 && <Upload showUploadList={false} directory  beforeUpload={transferFile} >
            <Button icon={<UploadOutlined />}>{cardTxt[currentCard]}</Button>
          </Upload>}
          {currentCard === 2 && 
            <>
              <Upload showUploadList={false} accept=".xls,.XLS,.xlsx,.XLSX" beforeUpload={transferFile} >
                <Button icon={<UploadOutlined />}>{cardTxt[currentCard]}</Button>
              </Upload>
              {/* <a href='../../../public/文案模板.xlsx'>模板</a> */}
              <Button onClick={downloadXlsx}>下载模板</Button>
            </>
          }
          <Button onClick={e=>setXlsxList([])}>清空</Button>
        </Space>
        {currentCard !== 2 && <div className='transfer-content'>
          {files?.length > 0 && <p className='status'>处理完成！🎉</p>}
          {
            <List
              itemLayout="horizontal"
              dataSource={files}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={item?.data}
                  />
                  <CopyToClipboard text={item?.data}
                  onCopy={() => setCopied(true)}>
                    <Button type="link" size='small'>复制</Button>
                    </CopyToClipboard>
                </List.Item>
              )}
            />
          }
        </div>}
        {currentCard === 2 && <div className='transfer-content'>
        {
          xlsxList?.map((item) => {
            return item?.data?.length > 0 && <>
                <h3>{item.name}🎈</h3>
                <List
                itemLayout="horizontal"
                dataSource={item.data}
                renderItem={(xitem, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={xitem.title}
                    />
                      {xitem.status ==='success' ?  <Button type="link" size='small'>下载完成</Button> : <div>下载中...</div>}
                  </List.Item>
                )}
              />
            </>
          })
          }
        </div>
        }
      </div>
    </HomeStyled>
  );
};
export default Home