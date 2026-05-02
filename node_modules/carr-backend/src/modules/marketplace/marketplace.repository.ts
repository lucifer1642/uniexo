import { MarketplaceItem, IMarketplaceItem, Message, IMessage, Offer, IOffer } from '../../database/models';

import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';

export class MarketplaceRepository {
  async createItem(data: Partial<IMarketplaceItem>): Promise<IMarketplaceItem> {
    return MarketplaceItem.create(data);
  }

  async findItemById(id: string): Promise<IMarketplaceItem | null> {
    return MarketplaceItem.findById(id).populate('sellerId', 'name email phone').exec();
  }

  async updateItem(id: string, data: Partial<IMarketplaceItem>): Promise<IMarketplaceItem | null> {
    return MarketplaceItem.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async softDeleteItem(id: string): Promise<void> {
    await MarketplaceItem.findByIdAndUpdate(id, { isDeleted: true });
  }

  async findAllItems(filter: Record<string, any>, query: PaginationQuery) {
    return paginate(MarketplaceItem, filter, query, { path: 'sellerId', select: 'name email' });
  }

  async findItemsByUser(userId: string, query: PaginationQuery) {
    return paginate(MarketplaceItem, { sellerId: userId }, query);
  }

  async addImages(id: string, images: string[]): Promise<IMarketplaceItem | null> {
    return MarketplaceItem.findByIdAndUpdate(
      id,
      { $push: { images: { $each: images } } },
      { new: true },
    ).exec();
  }

  async reportItem(id: string, reason: string): Promise<IMarketplaceItem | null> {
    return MarketplaceItem.findByIdAndUpdate(
      id,
      {
        $inc: { reportCount: 1 },
        $push: { reportReasons: reason },
        $set: { isReported: true },
      },
      { new: true },
    ).exec();
  }

  // Messages
  async createMessage(data: Partial<IMessage>): Promise<IMessage> {
    return Message.create(data);
  }

  async getConversation(userId1: string, userId2: string, itemId?: string, query?: PaginationQuery) {
    const filter: Record<string, any> = {
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    };
    if (itemId) filter.itemId = itemId;
    return paginate(Message, filter, query || { page: 1, limit: 50, sort: 'createdAt', order: 'asc' });
  }

  async getUserConversations(userId: string) {
    return Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
          isDeleted: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { isRead: true },
    );
  }

  // Offers
  async createOffer(data: Partial<IOffer>): Promise<IOffer> {
    return Offer.create(data);
  }

  async findOfferById(id: string): Promise<IOffer | null> {
    return Offer.findById(id).populate('itemId').populate('buyerId', 'name email phone').populate('sellerId', 'name email phone').exec();
  }

  async updateOfferStatus(id: string, status: string): Promise<IOffer | null> {
    return Offer.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async findOffersByBuyer(buyerId: string, query: PaginationQuery) {
    return paginate(Offer, { buyerId }, query, [
      { path: 'itemId', select: 'title price images category' },
      { path: 'sellerId', select: 'name email phone' }
    ]);
  }

  async findOffersBySeller(sellerId: string, query: PaginationQuery) {
    return paginate(Offer, { sellerId }, query, [
      { path: 'itemId', select: 'title price images category' },
      { path: 'buyerId', select: 'name email phone' }
    ]);
  }

  async findOffersForItem(itemId: string, query: PaginationQuery) {
    return paginate(Offer, { itemId }, query, [
      { path: 'buyerId', select: 'name email phone' }
    ]);
  }
}
