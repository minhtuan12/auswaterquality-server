import {HttpStatusCode} from '../enums/httpCode.enum'
import {CommunityModel} from '../models'
import {ICommunity} from '../types/community.type'
import ResponseHelper from '../utils/response.helper'

export default class CommunityService {
  private readonly communityModel

  constructor() {
    this.communityModel = CommunityModel
  }

  async getCommunityById(id?: string): Promise<ICommunity> {
    if (!id) {
      throw new ResponseHelper('Community not found', HttpStatusCode.NOT_FOUND)
    }
    const community = await this.communityModel.findById(id)
    if (!community) {
      throw new ResponseHelper('Community not found', HttpStatusCode.NOT_FOUND)
    }
    return this.sanitizeCommunity(community)
  }

  async getCommunitiesWithProgress(progress?: string): Promise<ICommunity[]> {
    if (progress && progress === 'all') {
      return await this.communityModel.find({progress: {$ne: ""}});
    }
    const prg = progress || 'Data in process';
    const communities = await this.communityModel.find({progress: prg});
    return communities as any;
  }

  public sanitizeCommunity(news: any): ICommunity {
    const newsObject = news.toObject ? news.toObject() : news
    return newsObject
  }
}
